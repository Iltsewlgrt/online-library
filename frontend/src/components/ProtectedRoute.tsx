import { Navigate, Outlet } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../auth/AuthContext';

/**
 * Wraps a subtree of routes that require authentication.
 * Renders children directly (use inside a wrapping <Route element={...}>).
 */
export function RequireAuth({ children }: { children: ReactNode }) {
    const { loading, user } = useAuth();

    if (loading) {
        return <div className="page-state">Loading...</div>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return children;
}
