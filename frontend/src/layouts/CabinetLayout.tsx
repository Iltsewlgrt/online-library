import { NavLink, Outlet } from 'react-router-dom';

const cabinetLinks = [
    { to: '/cabinet/profile', label: 'Profile' },
    { to: '/cabinet/likes', label: 'My Likes' },
    { to: '/cabinet/reading-list', label: 'Reading List' },
    { to: '/cabinet/comments', label: 'Comment History' },
    { to: '/cabinet/search', label: 'My Books Search' },
];

export function CabinetLayout() {
    return (
        <div className="cabinet">
            <aside className="cabinet__sidebar">
                <h2>Cabinet</h2>
                <nav className="cabinet__nav">
                    {cabinetLinks.map((link) => (
                        <NavLink key={link.to} to={link.to} className={({ isActive }) => (isActive ? 'is-active' : '')}>
                            {link.label}
                        </NavLink>
                    ))}
                </nav>
            </aside>
            <section className="cabinet__content">
                <Outlet />
            </section>
        </div>
    );
}
