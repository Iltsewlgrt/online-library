import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import type { AuthResponse, AuthUser } from '../types';

interface AuthContextValue {
    user: AuthUser | null;
    token: string | null;
    loading: boolean;
    login: (username: string, password: string) => Promise<void>;
    register: (username: string, password: string) => Promise<void>;
    logout: () => void;
    refreshUser: (nextUser: AuthUser | null) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const bootstrap = async () => {
            const storedToken = localStorage.getItem('token');
            if (!storedToken) {
                setLoading(false);
                return;
            }

            try {
                const response = await api.get<AuthUser>('/users/me');
                setUser(response.data);
                setToken(storedToken);
            } catch {
                localStorage.removeItem('token');
                setUser(null);
                setToken(null);
            } finally {
                setLoading(false);
            }
        };

        void bootstrap();
    }, []);

    const authValue = useMemo<AuthContextValue>(() => ({
        user,
        token,
        loading,
        login: async (username, password) => {
            const response = await api.post<AuthResponse>('/auth/login', { username, password });
            localStorage.setItem('token', response.data.token);
            setToken(response.data.token);
            setUser(response.data.user);
        },
        register: async (username, password) => {
            const response = await api.post<AuthResponse>('/auth/register', { username, password });
            localStorage.setItem('token', response.data.token);
            setToken(response.data.token);
            setUser(response.data.user);
        },
        logout: () => {
            localStorage.removeItem('token');
            setToken(null);
            setUser(null);
        },
        refreshUser: (nextUser) => {
            setUser(nextUser);
        },
    }), [loading, token, user]);

    return <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used inside AuthProvider');
    }

    return context;
}
