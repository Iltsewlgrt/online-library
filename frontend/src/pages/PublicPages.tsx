import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { BookCard } from '../components/BookCard';
import { Pagination } from '../components/Pagination';
import { useAuth } from '../auth/AuthContext';
import type { BookDetails, BookMeStatus, BookPreview, CommentItem, PaginatedResponse, ReadingItem } from '../types';

type SearchResponse = PaginatedResponse<BookPreview>;

function AuthForm({
    title,
    submitLabel,
    onSubmit,
}: {
    title: string;
    submitLabel: string;
    onSubmit: (username: string, password: string) => Promise<void>;
}) {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        setLoading(true);
        setError('');

        try {
            await onSubmit(username, password);
            navigate('/');
        } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : 'Request failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="auth-card">
            <h1>{title}</h1>
            <form onSubmit={handleSubmit} className="form-stack">
                <label>
                    Username
                    <input value={username} onChange={(e) => setUsername(e.target.value)} />
                </label>
                <label>
                    Password
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </label>
                {error ? <div className="error-banner">{error}</div> : null}
                <button className="button" disabled={loading}>
                    {loading ? 'Please wait...' : submitLabel}
                </button>
            </form>
        </section>
    );
}

export function LoginPage() {
    const { login } = useAuth();
    return <AuthForm title="Login" submitLabel="Sign in" onSubmit={login} />;
}

export function RegisterPage() {
    const { register } = useAuth();
    return <AuthForm title="Register" submitLabel="Create account" onSubmit={register} />;
}

export function HomePage() {
    const [inputValue, setInputValue] = useState('');
    const [query, setQuery] = useState('');
    const [page, setPage] = useState(1);
    const [items, setItems] = useState<BookPreview[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!query.trim()) {
            setItems([]);
            setTotal(0);
            return;
        }

        let cancelled = false;

        const load = async () => {
            setLoading(true);
            setError('');

            try {
                const response = await api.get<SearchResponse>('/library/search', {
                    params: { q: query, page, limit: 12 },
                });
                if (!cancelled) {
                    setItems(response.data.items);
                    setTotal(response.data.total);
                }
            } catch (searchError) {
                if (!cancelled) {
                    setError(searchError instanceof Error ? searchError.message : 'Search failed');
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        void load();
        return () => { cancelled = true; };
    }, [page, query]);

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault();
        const trimmed = inputValue.trim();
        if (!trimmed) {
            setItems([]);
            setTotal(0);
            setQuery('');
            return;
        }
        setPage(1);
        setQuery(trimmed);
    };

    const resultHint = useMemo(() => {
        if (!query.trim()) {
            return 'Search by title or author. Results come from Open Library.';
        }
        return `${total} books found`;
    }, [query, total]);

    return (
        <section className="page-section">
            <div className="hero-panel">
                <p className="eyebrow">Open Library explorer</p>
                <h1>Search books, keep notes, and manage your reading life.</h1>
                <form onSubmit={handleSubmit} className="search-bar">
                    <input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Search by title or author"
                    />
                    <button className="button">Search</button>
                </form>
                <p className="helper-text">{resultHint}</p>
            </div>

            {loading ? <div className="page-state">Loading...</div> : null}
            {error ? <div className="error-banner">{error}</div> : null}

            <div className="cards-grid">
                {items.map((book) => (
                    <BookCard key={book.bookId} book={book} />
                ))}
            </div>

            <Pagination page={page} total={total} limit={12} onChange={setPage} />
        </section>
    );
}

export function BookPage() {
    const { bookId } = useParams<{ bookId: string }>();
    const { user } = useAuth();

    const [book, setBook] = useState<BookDetails | null>(null);
    const [comments, setComments] = useState<CommentItem[]>([]);
    const [commentsTotal, setCommentsTotal] = useState(0);
    const [commentsPage, setCommentsPage] = useState(1);

    const [liked, setLiked] = useState(false);
    const [readingStatus, setReadingStatus] = useState<ReadingItem['status'] | null>(null);
    const [statusToSave, setStatusToSave] = useState<ReadingItem['status']>('WANT');

    const [commentText, setCommentText] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);    const [editingText, setEditingText] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionError, setActionError] = useState('');

    const loadComments = async (targetPage: number) => {
        if (!bookId) return;

        const response = await api.get<PaginatedResponse<CommentItem>>(
            `/library/books/${bookId}/comments`,
            { params: { page: targetPage, limit: 5 } },
        );
        setComments(response.data.items);
        setCommentsTotal(response.data.total);
    };

    useEffect(() => {
        if (!bookId) return;

        let cancelled = false;

        const load = async () => {
            setLoading(true);
            setError('');
            setActionError('');

            try {
                const [bookRes, commentsRes, meStatusRes] = await Promise.all([
                    api.get<BookDetails>(`/library/books/${bookId}`),
                    api.get<PaginatedResponse<CommentItem>>(
                        `/library/books/${bookId}/comments`,
                        { params: { page: 1, limit: 5 } },
                    ),
                    api.get<BookMeStatus>(`/library/books/${bookId}/me-status`),
                ]);

                if (cancelled) return;

                setBook(bookRes.data);
                setComments(commentsRes.data.items);
                setCommentsTotal(commentsRes.data.total);
                setCommentsPage(1);
                setLiked(meStatusRes.data.liked);
                setReadingStatus(meStatusRes.data.readingStatus);
                if (meStatusRes.data.readingStatus) {
                    setStatusToSave(meStatusRes.data.readingStatus);
                }
            } catch (loadError) {
                if (!cancelled) {
                    setError(loadError instanceof Error ? loadError.message : 'Failed to load book');
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        void load();
        return () => { cancelled = true; };
    }, [bookId, user?.id]);

    useEffect(() => {
        if (!loading) {
            void loadComments(commentsPage);
        }
    }, [commentsPage]);

    const handleToggleLike = async () => {
        if (!bookId) return;

        try {
            const response = await api.post<{ liked: boolean; likesCount: number }>(
                `/library/books/${bookId}/likes/toggle`,
            );
            setLiked(response.data.liked);
            setBook((cur) => cur ? { ...cur, likesCount: response.data.likesCount } : cur);
        } catch (toggleError) {
            setActionError(toggleError instanceof Error ? toggleError.message : 'Unable to toggle like');
        }
    };

    const handleSaveReadingStatus = async () => {
        if (!bookId) return;

        try {
            await api.post(`/library/me/reading-list/${bookId}`, { status: statusToSave });
            setReadingStatus(statusToSave);
        } catch (saveError) {
            setActionError(saveError instanceof Error ? saveError.message : 'Unable to save reading status');
        }
    };

    const handleRemoveFromList = async () => {
        if (!bookId) return;

        try {
            await api.delete(`/library/me/reading-list/${bookId}`);
            setReadingStatus(null);
        } catch (removeError) {
            setActionError(removeError instanceof Error ? removeError.message : 'Unable to remove from list');
        }
    };

    const handleCommentSubmit = async (event: FormEvent) => {
        event.preventDefault();
        if (!bookId || !commentText.trim()) return;

        try {
            await api.post(`/library/books/${bookId}/comments`, { text: commentText });
            setCommentText('');
            await loadComments(1);
            setCommentsPage(1);
            setBook((cur) => cur ? { ...cur, commentsCount: cur.commentsCount + 1 } : cur);
        } catch (commentError) {
            setActionError(commentError instanceof Error ? commentError.message : 'Unable to create comment');
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        try {
            await api.delete(`/library/comments/${commentId}`);
            await loadComments(commentsPage);
            setBook((cur) => cur ? { ...cur, commentsCount: Math.max(0, cur.commentsCount - 1) } : cur);
        } catch (deleteError) {
            setActionError(deleteError instanceof Error ? deleteError.message : 'Unable to delete comment');
        }
    };

    const startEdit = (comment: CommentItem) => {
        setEditingId(comment.id);
        setEditingText(comment.text);
        setActionError('');
    };

    const saveEdit = async () => {
        if (!editingId) return;
        try {
            await api.patch(`/library/comments/${editingId}`, { text: editingText });
            setEditingId(null);
            setEditingText('');
            await loadComments(commentsPage);
        } catch (saveError) {
            setActionError(saveError instanceof Error ? saveError.message : 'Unable to save comment');
        }
    };

    if (loading) {
        return <div className="page-state">Loading book...</div>;
    }

    if (error) {
        return <div className="error-banner">{error}</div>;
    }

    if (!book) {
        return <div className="page-state">Book not found</div>;
    }

    const isAuthor = (comment: CommentItem) => user?.id === comment.author.id;
    const fallback = 'https://placehold.co/400x600?text=No+Cover';

    return (
        <section className="book-page">
            <article className="book-detail">
                <img
                    className="book-detail__cover"
                    src={book.bookCover || fallback}
                    alt={book.bookTitle}
                />
                <div className="book-detail__body">
                    <p className="eyebrow">Book details</p>
                    <h1>{book.bookTitle}</h1>
                    <p className="muted">{book.bookAuthors}</p>
                    <p>{book.description || 'No description available.'}</p>
                    <div className="stats-row">
                        <span>{book.likesCount} {book.likesCount === 1 ? 'like' : 'likes'}</span>
                        <span>{book.commentsCount} {book.commentsCount === 1 ? 'comment' : 'comments'}</span>
                    </div>

                    {user ? (
                        <div className="actions-row">
                            <button className="button" onClick={handleToggleLike}>
                                {liked ? 'Unlike' : 'Like'}
                            </button>

                            <select
                                value={statusToSave}
                                onChange={(e) => setStatusToSave(e.target.value as ReadingItem['status'])}
                            >
                                <option value="WANT">Want to read</option>
                                <option value="READING">Reading now</option>
                                <option value="DONE">Finished</option>
                            </select>
                            <button className="button button--secondary" onClick={handleSaveReadingStatus}>
                                {readingStatus ? 'Update status' : 'Add to list'}
                            </button>
                            {readingStatus ? (
                                <button className="button button--ghost" onClick={handleRemoveFromList}>
                                    Remove from list
                                </button>
                            ) : null}
                            <span className="helper-text">
                                Status: {readingStatus ?? 'not in list'}
                            </span>
                        </div>
                    ) : null}
                </div>
            </article>

            {actionError ? <div className="error-banner">{actionError}</div> : null}

            <section className="panel">
                <h2>Public comments</h2>

                {user ? (
                    <form onSubmit={handleCommentSubmit} className="form-stack">
                        <textarea
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder="Write a public comment"
                            rows={4}
                        />
                        <button className="button" disabled={!commentText.trim()}>
                            Add comment
                        </button>
                    </form>
                ) : (
                    <p className="helper-text">Log in to leave a comment.</p>
                )}

                <div className="list-stack">
                    {comments.map((comment) => (
                        <article key={comment.id} className="comment-card">
                            <div className="comment-card__meta">
                                <strong>{comment.author.username}</strong>
                                <span>{new Date(comment.createdAt).toLocaleString()}</span>
                            </div>

                            {editingId === comment.id ? (
                                <div className="form-stack">
                                    <textarea
                                        value={editingText}
                                        onChange={(e) => setEditingText(e.target.value)}
                                        rows={3}
                                    />
                                    <div className="actions-row">
                                        <button className="button" type="button" onClick={saveEdit} disabled={!editingText.trim()}>
                                            Save
                                        </button>
                                        <button className="button button--ghost" type="button" onClick={() => { setEditingId(null); setActionError(''); }}>
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <p>{comment.text}</p>
                                    {isAuthor(comment) ? (
                                        <div className="comment-card__actions">
                                            <button className="button button--ghost" onClick={() => startEdit(comment)}>
                                                Edit
                                            </button>
                                            <button className="button button--ghost" onClick={() => handleDeleteComment(comment.id)}>
                                                Delete
                                            </button>
                                        </div>
                                    ) : null}
                                </>
                            )}
                        </article>
                    ))}
                </div>

                <Pagination
                    page={commentsPage}
                    total={commentsTotal}
                    limit={5}
                    onChange={setCommentsPage}
                />
            </section>
        </section>
    );
}
