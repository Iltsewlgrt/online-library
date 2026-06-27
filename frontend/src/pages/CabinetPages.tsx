import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { Pagination } from '../components/Pagination';
import { useAuth } from '../auth/AuthContext';
import type { AuthUser, CommentItem, LikeItem, PaginatedResponse, ReadingItem } from '../types';

// ─── Shared sub-component ────────────────────────────────────────────────────

function BookList({ items }: { items: Array<LikeItem | ReadingItem> }) {
    return (
        <div className="cards-grid cards-grid--compact">
            {items.map((item) => (
                <Link key={item.id} to={`/books/${item.bookId}`} className="book-row-card">
                    <img
                        src={item.bookCover || 'https://placehold.co/400x600?text=No+Cover'}
                        alt={item.bookTitle}
                    />
                    <div>
                        <h3>{item.bookTitle}</h3>
                        <p>{item.bookAuthors}</p>
                    </div>
                </Link>
            ))}
        </div>
    );
}

// ─── Profile page ─────────────────────────────────────────────────────────────

export function ProfilePage() {
    const { user, refreshUser } = useAuth();
    const [profile, setProfile] = useState<AuthUser | null>(user);
    const [username, setUsername] = useState(user?.username ?? '');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const response = await api.get<AuthUser>('/users/me');
                setProfile(response.data);
                setUsername(response.data.username);
            } catch {
                // Profile is already populated from auth context; ignore fetch errors here.
            }
        };

        void loadProfile();
    }, []);

    const handleUsernameSubmit = async (event: FormEvent) => {
        event.preventDefault();
        setError('');
        setMessage('');

        try {
            const response = await api.patch<AuthUser>('/users/me/username', { username });
            setProfile(response.data);
            refreshUser(response.data);
            setMessage('Username updated');
        } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : 'Unable to update username');
        }
    };

    const handlePasswordSubmit = async (event: FormEvent) => {
        event.preventDefault();
        setError('');
        setMessage('');

        try {
            await api.patch('/users/me/password', { currentPassword, newPassword });
            setCurrentPassword('');
            setNewPassword('');
            setMessage('Password updated');
        } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : 'Unable to update password');
        }
    };

    return (
        <div className="panel profile-grid">
            <div>
                <p className="eyebrow">Profile</p>
                <h1>{profile?.username ?? 'Profile'}</h1>
            </div>

            <form className="form-stack" onSubmit={handleUsernameSubmit}>
                <label>
                    Change username
                    <input value={username} onChange={(e) => setUsername(e.target.value)} />
                </label>
                <button className="button">Save username</button>
            </form>

            <form className="form-stack" onSubmit={handlePasswordSubmit}>
                <label>
                    Current password
                    <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                </label>
                <label>
                    New password
                    <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                    />
                </label>
                <button className="button button--secondary">Change password</button>
            </form>

            {message ? <div className="success-banner">{message}</div> : null}
            {error ? <div className="error-banner">{error}</div> : null}
        </div>
    );
}

// ─── Likes page ───────────────────────────────────────────────────────────────

export function LikesPage() {
    const [query, setQuery] = useState('');
    const [page, setPage] = useState(1);
    const [data, setData] = useState<PaginatedResponse<LikeItem> | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            setLoading(true);
            setError('');

            try {
                const response = await api.get<PaginatedResponse<LikeItem>>('/library/me/likes', {
                    params: { page, limit: 10, q: query || undefined },
                });
                if (!cancelled) setData(response.data);
            } catch (loadError) {
                if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Unable to load likes');
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        void load();
        return () => { cancelled = true; };
    }, [page, query]);

    return (
        <div className="panel">
            <div className="page-header">
                <div>
                    <p className="eyebrow">My likes</p>
                    <h1>Liked books</h1>
                </div>
                <input
                    placeholder="Search my likes"
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                />
            </div>
            {loading ? <div className="page-state">Loading...</div> : null}
            {error ? <div className="error-banner">{error}</div> : null}
            {data && !loading ? <BookList items={data.items} /> : null}
            <Pagination page={page} total={data?.total ?? 0} limit={10} onChange={setPage} />
        </div>
    );
}

// ─── Reading list page ────────────────────────────────────────────────────────

export function ReadingListPage() {
    const [query, setQuery] = useState('');
    const [status, setStatus] = useState<ReadingItem['status'] | ''>('');
    const [page, setPage] = useState(1);
    const [data, setData] = useState<PaginatedResponse<ReadingItem> | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            setLoading(true);
            setError('');

            try {
                const response = await api.get<PaginatedResponse<ReadingItem>>('/library/me/reading-list', {
                    params: { page, limit: 10, q: query || undefined, status: status || undefined },
                });
                if (!cancelled) setData(response.data);
            } catch (loadError) {
                if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Unable to load reading list');
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        void load();
        return () => { cancelled = true; };
    }, [page, query, status]);

    return (
        <div className="panel">
            <div className="page-header">
                <div>
                    <p className="eyebrow">Reading list</p>
                    <h1>Books I am tracking</h1>
                </div>
                <div className="filters-row">
                    <input
                        placeholder="Search my reading list"
                        value={query}
                        onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                    />
                    <select
                        value={status}
                        onChange={(e) => { setStatus(e.target.value as ReadingItem['status'] | ''); setPage(1); }}
                    >
                        <option value="">All statuses</option>
                        <option value="WANT">Want to read</option>
                        <option value="READING">Reading now</option>
                        <option value="DONE">Finished</option>
                    </select>
                </div>
            </div>
            {loading ? <div className="page-state">Loading...</div> : null}
            {error ? <div className="error-banner">{error}</div> : null}
            {data && !loading ? (
                <div className="cards-grid cards-grid--compact">
                    {data.items.map((item) => (
                        <article key={item.id} className="book-row-card book-row-card--static">
                            <img
                                src={item.bookCover || 'https://placehold.co/400x600?text=No+Cover'}
                                alt={item.bookTitle}
                            />
                            <div>
                                <h3>{item.bookTitle}</h3>
                                <p>{item.bookAuthors}</p>
                                <span className="status-pill">{item.status}</span>
                            </div>
                            <Link className="button button--ghost" to={`/books/${item.bookId}`}>
                                Open
                            </Link>
                        </article>
                    ))}
                </div>
            ) : null}
            <Pagination page={page} total={data?.total ?? 0} limit={10} onChange={setPage} />
        </div>
    );
}

// ─── Comments history page ────────────────────────────────────────────────────

export function CommentsPage() {
    const [page, setPage] = useState(1);
    const [data, setData] = useState<PaginatedResponse<CommentItem> | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingText, setEditingText] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionError, setActionError] = useState('');

    const loadComments = async (targetPage: number) => {
        setLoading(true);
        setError('');

        try {
            const response = await api.get<PaginatedResponse<CommentItem>>('/library/me/comments', {
                params: { page: targetPage, limit: 10 },
            });
            setData(response.data);
        } catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : 'Unable to load comments');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadComments(page);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page]);

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
            await loadComments(page);
        } catch (saveError) {
            setActionError(saveError instanceof Error ? saveError.message : 'Unable to save comment');
        }
    };

    const deleteComment = async (commentId: string) => {
        try {
            await api.delete(`/library/comments/${commentId}`);
            // If we deleted the last item on a page > 1, go back one page
            const remainingOnPage = (data?.items.length ?? 1) - 1;
            const targetPage = remainingOnPage === 0 && page > 1 ? page - 1 : page;
            if (targetPage !== page) {
                setPage(targetPage);
            } else {
                await loadComments(targetPage);
            }
        } catch (deleteError) {
            setActionError(deleteError instanceof Error ? deleteError.message : 'Unable to delete comment');
        }
    };

    return (
        <div className="panel">
            <div className="page-header">
                <div>
                    <p className="eyebrow">Comment history</p>
                    <h1>All my comments</h1>
                </div>
            </div>
            {loading ? <div className="page-state">Loading...</div> : null}
            {error ? <div className="error-banner">{error}</div> : null}
            {actionError ? <div className="error-banner">{actionError}</div> : null}
            <div className="list-stack">
                {data?.items.map((comment) => (
                    <article key={comment.id} className="comment-card">
                        <div className="comment-card__meta">
                            <Link to={`/books/${comment.bookId}`} className="comment-book-link">
                                {comment.bookTitle}
                            </Link>
                            <span>{new Date(comment.createdAt).toLocaleString()}</span>
                        </div>
                        <p>{comment.text}</p>
                        {editingId === comment.id ? (
                            <div className="form-stack">
                                <textarea
                                    value={editingText}
                                    onChange={(e) => setEditingText(e.target.value)}
                                    rows={4}
                                />
                                <div className="actions-row">
                                    <button className="button" onClick={saveEdit} type="button">
                                        Save
                                    </button>
                                    <button
                                        className="button button--ghost"
                                        onClick={() => { setEditingId(null); setActionError(''); }}
                                        type="button"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="actions-row">
                                <button className="button button--ghost" onClick={() => startEdit(comment)}>
                                    Edit
                                </button>
                                <button
                                    className="button button--ghost"
                                    onClick={() => deleteComment(comment.id)}
                                >
                                    Delete
                                </button>
                            </div>
                        )}
                    </article>
                ))}
            </div>
            <Pagination page={page} total={data?.total ?? 0} limit={10} onChange={setPage} />
        </div>
    );
}

// ─── My books search page ─────────────────────────────────────────────────────

export function MyBooksSearchPage() {
    const [query, setQuery] = useState('');
    const [scope, setScope] = useState<'likes' | 'reading'>('likes');
    const [page, setPage] = useState(1);
    const [data, setData] = useState<PaginatedResponse<LikeItem | ReadingItem> | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const scopeHint = scope === 'likes' ? 'Search within liked books' : 'Search within reading list';

    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await api.get<PaginatedResponse<LikeItem | ReadingItem>>('/library/me/books', {
                params: { scope, q: query || undefined, page, limit: 10 },
            });
            setData(response.data);
        } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : 'Unable to search your books');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="panel">
            <div className="page-header">
                <div>
                    <p className="eyebrow">My books search</p>
                    <h1>Find books in your data</h1>
                </div>
            </div>
            <form className="search-row" onSubmit={submit}>
                <select value={scope} onChange={(e) => setScope(e.target.value as 'likes' | 'reading')}>
                    <option value="likes">Liked books</option>
                    <option value="reading">Reading list</option>
                </select>
                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={scopeHint}
                />
                <button className="button">Search</button>
            </form>
            {loading ? <div className="page-state">Loading...</div> : null}
            {error ? <div className="error-banner">{error}</div> : null}
            {data && !loading ? <BookList items={data.items} /> : null}
            <Pagination page={page} total={data?.total ?? 0} limit={10} onChange={setPage} />
        </div>
    );
}
