import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function SiteLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navClass = ({ isActive }: { isActive: boolean }) =>
        isActive ? 'is-active' : undefined;

    return (
        <div className="app-shell">
            <header className="site-header">
                <Link to="/" className="brand">
                    Online Library
                </Link>
                <nav className="site-nav">
                    <NavLink to="/" end className={navClass}>
                        Search
                    </NavLink>
                    {user ? (
                        <>
                            <NavLink to="/cabinet/profile" className={navClass}>Cabinet</NavLink>
                            <button className="button button--ghost" onClick={handleLogout}>
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <NavLink to="/login" className={navClass}>Login</NavLink>
                            <NavLink to="/register" className={navClass}>Register</NavLink>
                        </>
                    )}
                </nav>
            </header>
            <main className="site-main">
                <Outlet />
            </main>
        </div>
    );
}
