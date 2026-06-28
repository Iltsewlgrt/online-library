import { Injectable, NotFoundException } from '@nestjs/common';
import NodeCache = require('node-cache');
import * as https from 'https';
import * as http from 'http';
import { config } from '../config';

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

interface OlSearchDoc {
    key?: string;
    title?: string;
    author_name?: string[];
    cover_edition_key?: string;
}

interface OlWork {
    title?: string;
    description?: string | { value?: string };
    authors?: Array<{ author?: { key?: string } }>;
    covers?: number[];
}

interface OlAuthor {
    name?: string;
}

@Injectable()
export class OpenLibraryService {
    private readonly cache = new NodeCache({
        stdTTL: config.openLibraryCacheTtlMs / 1000,
        checkperiod: 120,
    });
    private readonly authorCache = new NodeCache({ stdTTL: 24 * 60 * 60, checkperiod: 300 });

    private queue: Promise<unknown> = Promise.resolve();
    private lastExternalCallAt = 0;
    private readonly minDelayMs = config.openLibraryThrottleMs;
    private readonly requestTimeoutMs = 30_000;

    private readonly placeholderCover = 'https://placehold.co/400x600?text=No+Cover';

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

        const payload = await this.requestJson<{ docs: OlSearchDoc[]; numFound: number }>(url.toString());
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
        const work = await this.requestJson<OlWork>(url);
        if (!work) {
            throw new NotFoundException('Book not found');
        }

        const authorKeys: string[] = Array.isArray(work.authors)
            ? work.authors
                .map((item) => item?.author?.key)
                .filter((key): key is string => typeof key === 'string')
            : [];

        const authorNames = await Promise.all(authorKeys.map((key) => this.getAuthorName(key)));

        const coverId: number | null =
            Array.isArray(work.covers) && work.covers.length > 0 ? work.covers[0] : null;

        const snapshot: BookSnapshot = {
            bookId,
            bookTitle: work.title ?? 'Untitled',
            bookAuthors: authorNames.filter(Boolean).join(', ') || 'Unknown author',
            bookCover: this.coverByNumericId(coverId),
            description: this.normalizeDescription(work.description),
        };

        this.cache.set(cacheKey, snapshot);
        return snapshot;
    }

    async getBookDetails(bookId: string): Promise<BookSnapshot> {
        return this.getBookSnapshot(bookId);
    }

    private mapSearchDoc(doc: OlSearchDoc): SearchBookItem {
        const bookId = (doc.key ?? '').replace('/works/', '');

        const cover = doc.cover_edition_key
            ? this.coverByEditionOlid(doc.cover_edition_key)
            : this.placeholderCover;

        return {
            bookId,
            bookTitle: doc.title ?? 'Untitled',
            bookAuthors:
                Array.isArray(doc.author_name) && doc.author_name.length > 0
                    ? doc.author_name.join(', ')
                    : 'Unknown author',
            bookCover: cover,
        };
    }

    private coverByNumericId(coverId: number | null, size: 'S' | 'M' | 'L' = 'L'): string {
        if (!coverId || coverId < 0) {
            return this.placeholderCover;
        }

        return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`;
    }

    private coverByEditionOlid(olid: string, size: 'S' | 'M' | 'L' = 'M'): string {
        return `https://covers.openlibrary.org/b/olid/${olid}-${size}.jpg`;
    }

    private normalizeDescription(description: OlWork['description']): string | null {
        if (typeof description === 'string') {
            return description;
        }

        if (description && typeof description === 'object' && 'value' in description) {
            return typeof description.value === 'string' ? description.value : null;
        }

        return null;
    }

    private async getAuthorName(authorKey: string): Promise<string> {
        const normalizedKey = authorKey.replace('/authors/', '');
        const cached = this.authorCache.get<string>(normalizedKey);
        if (cached) {
            return cached;
        }

        const url = `https://openlibrary.org/authors/${encodeURIComponent(normalizedKey)}.json`;
        const author = await this.requestJson<OlAuthor>(url);
        const name = typeof author.name === 'string' ? author.name : 'Unknown author';
        this.authorCache.set(normalizedKey, name);
        return name;
    }

    private requestJson<T>(url: string): Promise<T> {
        const next = this.queue.then(() => this.executeRequest<T>(url));
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

    private httpGet<T>(url: string): Promise<T> {
        return new Promise((resolve, reject) => {
            const client = url.startsWith('https') ? https : http;
            const req = client.get(url, { timeout: this.requestTimeoutMs }, (res) => {
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
