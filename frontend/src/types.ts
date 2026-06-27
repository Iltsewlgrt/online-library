export interface AuthUser {
    id: string;
    username: string;
    createdAt?: string;
}

export interface AuthResponse {
    user: AuthUser;
    token: string;
}

export interface BookPreview {
    bookId: string;
    bookTitle: string;
    bookAuthors: string;
    bookCover: string | null;
}

export interface BookDetails extends BookPreview {
    description: string | null;
    likesCount: number;
    commentsCount: number;
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
}

export interface CommentItem {
    id: string;
    text: string;
    bookId: string;
    bookTitle: string;
    bookAuthors: string;
    bookCover: string | null;
    createdAt: string;
    updatedAt: string;
    author: AuthUser;
}

export interface LikeItem extends BookPreview {
    id: string;
    createdAt: string;
}

export interface ReadingItem extends BookPreview {
    id: string;
    status: 'WANT' | 'READING' | 'DONE';
    createdAt: string;
    updatedAt: string;
}

/** Response from GET /library/books/:bookId/me-status */
export interface BookMeStatus {
    liked: boolean;
    readingStatus: ReadingItem['status'] | null;
}
