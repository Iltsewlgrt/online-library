import { Injectable, NotFoundException } from '@nestjs/common';
import NodeCache = require('node-cache');
import * as https from 'https';
import * as http from 'http';

export interface BookSnapshot {
    bookId: string;
    bookTitle: string;
    bookAuthors: string;
    bookCover: string | null;
    description: string | null;
}

export interface SearchBookItem {
    bookId: string;
    bookTitle: string;
    bookAuthors: string;
    bookCover: string | null;
}

/**
 * Thin wrapper around the Open Library public API.
 *
 * Guarantees:
 *  - All successful responses are cached in-memory for 30 minutes (TTL = 1800 s).
 *  - At most 1 outbound HTTP request per second reaches openlibrary.org (serial
 *    queue with a 1 000 ms minimum gap between consecutive calls).
 */
@Injectable()
export class OpenLibraryService {
    /** 30-minute TTL; background check every 2 minutes to evict stale entries. */
    private readonly cache = new NodeCache({ stdTTL: 60 * 30, checkperiod: 120 });

    /**
     * Serialised promise chain that every outbound request is enqueued onto.
     * Each task waits for the previous one to finish *and* respects the 1 req/s
     * minimum inter-call gap before firing.
     */
    private queue: Promise<unknown> = Promise.resolve();

    private lastExternalCallAt = 0;
    private readonly minDelayMs = 1000;

    private readonly placeholderCover = 'https://placehold.co/400x600?text=No+Cover';

    // ─── Public API ────────────────────────────────────────────────────────────

    async searchBooks(query: string, page = 1, limit = 12) {
        const cacheKey = `search:${query}:${page}:${limit}`;
        const cached = this.cache.get<{ items: SearchBookItem[]; total: number }>(cacheKey);
        if (cached) {
            return { ...cached, page, limit };
        }

        const url = new URL('https://openlibrary.org/search.json');
        url.searchParams.set('q', query);
        url.searchParams.set('page', String(page));
        url.searchParams.set('limit', String(limit));
        url.searchParams.set('fields', 'key,title,author_name,cover_edition_key');

        const payload = await this.requestJson<{ docs: any[]; numFound: number }>(url.toString());
        const items = (payload.docs ?? []).map((doc) => this.mapSearchDoc(doc));
        const result = { items, total: payload.numFound ?? items.length };

        this.cache.set(cacheKey, result);
        return { ...result, page, limit };
    }

    async getBookSnapshot(bookId: string): Promise<BookSnapshot> {
        const cacheKey = `details:${bookId}`;
        const cached = this.cache.get<BookSnapshot>(cacheKey);
        if (cached) {
            return cached;
        }

        const url = `https://openlibrary.org/works/${encodeURIComponent(bookId)}.json`;
        const work = await this.requestJson<any>(url);
        if (!work) {
            throw new NotFoundException('Book not found');
        }

        // Resolve author names (each is a separate API call; results are individually cached).
        const authorKeys: string[] = Array.isArray(work.authors)
            ? work.authors.map((item: any) => item?.author?.key).filter(Boolean)
            : [];

        const authorNames = await Promise.all(authorKeys.map((key) => this.getAuthorName(key)));

        // Works expose covers as numeric IDs (e.g. 12345678).
        const coverId: number | null =
            Array.isArray(work.covers) && work.covers.length > 0 ? work.covers[0] : null;

        const snapshot: BookSnapshot = {
            bookId,
            bookTitle: work.title || 'Untitled',
            bookAuthors: authorNames.filter(Boolean).join(', ') || 'Unknown author',
            bookCover: this.coverByNumericId(coverId),
            description: this.normalizeDescription(work.description),
        };

        this.cache.set(cacheKey, snapshot);
        return snapshot;
    }

    /** Convenience alias kept for compatibility with LibraryService. */
    async getBookDetails(bookId: string): Promise<BookSnapshot> {
        return this.getBookSnapshot(bookId);
    }

    // ─── Private helpers ───────────────────────────────────────────────────────

    private mapSearchDoc(doc: any): SearchBookItem {
        const bookId = String(doc?.key ?? '').replace('/works/', '');

        // `cover_edition_key` is an edition OLID (e.g. "OL7353617M").
        // The Covers API supports /b/olid/<OLID>-<SIZE>.jpg for this.
        const cover = doc?.cover_edition_key
            ? this.coverByEditionOlid(doc.cover_edition_key)
            : this.placeholderCover;

        return {
            bookId,
            bookTitle: doc?.title || 'Untitled',
            bookAuthors:
                Array.isArray(doc?.author_name) && doc.author_name.length > 0
                    ? doc.author_name.join(', ')
                    : 'Unknown author',
            bookCover: cover,
        };
    }

    /**
     * Build a cover URL from a numeric cover ID (used by /works/*.json).
     * @param coverId  Numeric cover ID from the works endpoint.
     * @param size     S | M | L  (default L for detail pages).
     */
    private coverByNumericId(coverId: number | null, size: 'S' | 'M' | 'L' = 'L'): string {
        if (!coverId || coverId < 0) {
            return this.placeholderCover;
        }

        return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`;
    }

    /**
     * Build a cover URL from an edition OLID (used by search results).
     * @param olid  Edition OLID string, e.g. "OL7353617M".
     * @param size  S | M | L  (default M for search result cards).
     */
    private coverByEditionOlid(olid: string, size: 'S' | 'M' | 'L' = 'M'): string {
        if (!olid) {
            return this.placeholderCover;
        }

        return `https://covers.openlibrary.org/b/olid/${olid}-${size}.jpg`;
    }

    private normalizeDescription(description: unknown): string | null {
        if (typeof description === 'string') {
            return description;
        }

        if (description && typeof description === 'object' && 'value' in description) {
            const value = (description as { value?: unknown }).value;
            return typeof value === 'string' ? value : null;
        }

        return null;
    }

    private async getAuthorName(authorKey: string): Promise<string> {
        const normalizedKey = authorKey.replace('/authors/', '');
        const cacheKey = `author:${normalizedKey}`;
        const cached = this.cache.get<string>(cacheKey);
        if (cached) {
            return cached;
        }

        const url = `https://openlibrary.org/authors/${encodeURIComponent(normalizedKey)}.json`;
        const author = await this.requestJson<any>(url);
        const name = typeof author?.name === 'string' ? author.name : 'Unknown author';
        this.cache.set(cacheKey, name);
        return name;
    }

    /**
     * Enqueue an HTTP GET request onto the serial throttle queue.
     * Guarantees no more than one outbound request per second.
     */
    private requestJson<T>(url: string): Promise<T> {
        // Chain onto the existing queue so requests execute one at a time.
        const next = this.queue.then(() => this.executeRequest<T>(url));

        // Replace the shared queue pointer with the tail of the new chain.
        // We swallow errors here so a failed request doesn't stall the queue.
        this.queue = next.catch(() => undefined);

        return next;
    }

    private async executeRequest<T>(url: string): Promise<T> {
        const elapsed = Date.now() - this.lastExternalCallAt;
        const wait = Math.max(0, this.minDelayMs - elapsed);
        if (wait > 0) {
            await new Promise<void>((resolve) => setTimeout(resolve, wait));
        }

        this.lastExternalCallAt = Date.now();
        return this.httpGet<T>(url);
    }

    /** Minimal wrapper around Node's built-in https/http — works on Windows without proxy issues. */
    private httpGet<T>(url: string): Promise<T> {
        return new Promise((resolve, reject) => {
            const client = url.startsWith('https') ? https : http;
            const req = client.get(url, { timeout: 15_000 }, (res) => {
                if (res.statusCode === 404) {
                    reject(new NotFoundException(`Open Library resource not found: ${url}`));
                    res.resume();
                    return;
                }

                const chunks: Buffer[] = [];
                res.on('data', (chunk: Buffer) => chunks.push(chunk));
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')) as T);
                    } catch {
                        reject(new Error('Failed to parse Open Library response'));
                    }
                });
                res.on('error', reject);
            });

            req.on('timeout', () => {
                req.destroy();
                reject(new Error(`Request to Open Library timed out: ${url}`));
            });

            req.on('error', reject);
        });
    }
}
