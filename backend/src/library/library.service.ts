import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { OpenLibraryService } from './open-library.service';
import { ReadingStatus } from './library.dto';

@Injectable()
export class LibraryService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly openLibrary: OpenLibraryService,
    ) { }

    async searchBooks(query: string, page = 1, limit = 12) {
        return this.openLibrary.searchBooks(query, page, limit);
    }

    async getBookDetails(bookId: string) {
        const [snapshot, likesCount, commentsCount] = await Promise.all([
            this.openLibrary.getBookSnapshot(bookId),
            this.prisma.like.count({ where: { bookId } }),
            this.prisma.comment.count({ where: { bookId } }),
        ]);

        return { ...snapshot, likesCount, commentsCount };
    }

    async getBookMeStatus(userId: string | undefined, bookId: string) {
        if (!userId) {
            return { liked: false, readingStatus: null };
        }

        const [like, readingItem] = await Promise.all([
            this.prisma.like.findUnique({ where: { userId_bookId: { userId, bookId } } }),
            this.prisma.readingItem.findUnique({ where: { userId_bookId: { userId, bookId } } }),
        ]);

        return {
            liked: like !== null,
            readingStatus: readingItem?.status ?? null,
        };
    }

    async getComments(bookId: string, page = 1, limit = 10) {
        const [items, total] = await Promise.all([
            this.prisma.comment.findMany({
                where: { bookId },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                include: { author: { select: { id: true, username: true } } },
            }),
            this.prisma.comment.count({ where: { bookId } }),
        ]);

        return { items, total, page, limit };
    }

    async createComment(userId: string, bookId: string, text: string) {
        const snapshot = await this.openLibrary.getBookSnapshot(bookId);
        return this.prisma.comment.create({
            data: {
                authorId: userId,
                bookId,
                text,
                bookTitle: snapshot.bookTitle,
                bookAuthors: snapshot.bookAuthors,
                bookCover: snapshot.bookCover,
            },
            include: { author: { select: { id: true, username: true } } },
        });
    }

    async updateComment(userId: string, commentId: string, text: string) {
        const comment = await this.prisma.comment.findUnique({ where: { id: commentId } });
        if (!comment) {
            throw new NotFoundException('Comment not found');
        }

        if (comment.authorId !== userId) {
            throw new ForbiddenException('You can edit only your own comments');
        }

        return this.prisma.comment.update({
            where: { id: commentId },
            data: { text },
            include: { author: { select: { id: true, username: true } } },
        });
    }

    async deleteComment(userId: string, commentId: string) {
        const comment = await this.prisma.comment.findUnique({ where: { id: commentId } });
        if (!comment) {
            throw new NotFoundException('Comment not found');
        }

        if (comment.authorId !== userId) {
            throw new ForbiddenException('You can delete only your own comments');
        }

        await this.prisma.comment.delete({ where: { id: commentId } });
        return { success: true };
    }

    async getMyComments(userId: string, page = 1, limit = 10) {
        const [items, total] = await Promise.all([
            this.prisma.comment.findMany({
                where: { authorId: userId },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                include: { author: { select: { id: true, username: true } } },
            }),
            this.prisma.comment.count({ where: { authorId: userId } }),
        ]);

        return { items, total, page, limit };
    }

    async toggleLike(userId: string, bookId: string) {
        const existing = await this.prisma.like.findUnique({
            where: { userId_bookId: { userId, bookId } },
        });

        if (existing) {
            await this.prisma.like.delete({ where: { userId_bookId: { userId, bookId } } });
            const likesCount = await this.prisma.like.count({ where: { bookId } });
            return { liked: false, likesCount };
        }

        const snapshot = await this.openLibrary.getBookSnapshot(bookId);
        await this.prisma.like.create({
            data: {
                userId,
                bookId,
                bookTitle: snapshot.bookTitle,
                bookAuthors: snapshot.bookAuthors,
                bookCover: snapshot.bookCover,
            },
        });

        const likesCount = await this.prisma.like.count({ where: { bookId } });
        return { liked: true, likesCount };
    }

    async getLikesCount(bookId: string) {
        return this.prisma.like.count({ where: { bookId } });
    }

    async getMyLikes(userId: string, page = 1, limit = 10, q?: string) {
        const where = this.buildBookSearchWhere(userId, q);
        const [items, total] = await Promise.all([
            this.prisma.like.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.like.count({ where }),
        ]);

        return { items, total, page, limit };
    }

    async getMyReadingList(userId: string, page = 1, limit = 10, status?: ReadingStatus, q?: string) {
        const where = this.buildBookSearchWhere(userId, q, status);
        const [items, total] = await Promise.all([
            this.prisma.readingItem.findMany({
                where,
                orderBy: { updatedAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.readingItem.count({ where }),
        ]);

        return { items, total, page, limit };
    }

    async upsertReadingItem(userId: string, bookId: string, status: ReadingStatus) {
        const snapshot = await this.openLibrary.getBookSnapshot(bookId);
        return this.prisma.readingItem.upsert({
            where: { userId_bookId: { userId, bookId } },
            create: {
                userId,
                bookId,
                status,
                bookTitle: snapshot.bookTitle,
                bookAuthors: snapshot.bookAuthors,
                bookCover: snapshot.bookCover,
            },
            update: {
                status,
                bookTitle: snapshot.bookTitle,
                bookAuthors: snapshot.bookAuthors,
                bookCover: snapshot.bookCover,
            },
        });
    }

    async deleteReadingItem(userId: string, bookId: string) {
        const existing = await this.prisma.readingItem.findUnique({
            where: { userId_bookId: { userId, bookId } },
        });
        if (!existing) {
            throw new NotFoundException('Reading list entry not found');
        }

        await this.prisma.readingItem.delete({ where: { userId_bookId: { userId, bookId } } });
        return { success: true };
    }

    async searchMyBooks(userId: string, scope: 'likes' | 'reading' = 'likes', q?: string, page = 1, limit = 10) {
        if (scope === 'likes') {
            return this.getMyLikes(userId, page, limit, q);
        }

        return this.getMyReadingList(userId, page, limit, undefined, q);
    }

    private buildBookSearchWhere(userId: string, q: string | undefined, status?: ReadingStatus) {
        const search = q?.trim();
        const textFilter = search
            ? {
                OR: [
                    { bookTitle: { contains: search, mode: 'insensitive' as const } },
                    { bookAuthors: { contains: search, mode: 'insensitive' as const } },
                ],
            }
            : {};

        return {
            userId,
            ...(status ? { status } : {}),
            ...textFilter,
        };
    }
}
