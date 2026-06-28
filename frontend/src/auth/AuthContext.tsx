import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../api';
import type { AuthResponse, AuthUser } from '../types';

interface AuthContextValue {
    user: AuthUser | null;
    loading: boolean;
    login: (username: string, password: string) => Promise<void>;
    register: (username: string, password: string) => Promise<void>;
    logout: () => void;
    refreshUser: (nextUser: AuthUser | null) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
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
            } catch {
                localStorage.removeItem('token');
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        void bootstrap();
    }, []);

    const login = useCallback(async (username: string, password: string) => {
        const response = await api.post<AuthResponse>('/auth/login', { username, password });
        localStorage.setItem('token', response.data.token);
        setUser(response.data.user);
    }, []);

    const register = useCallback(async (username: string, password: string) => {
        const response = await api.post<AuthResponse>('/auth/register', { username, password });
        localStorage.setItem('token', response.data.token);
        setUser(response.data.user);
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        setUser(null);
    }, []);

    const refreshUser = useCallback((nextUser: AuthUser | null) => {
        setUser(nextUser);
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used inside AuthProvider');
    }
    return context;
}
