import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

/**
 * Axios response interceptor: surfaces the server's error message
 * from the NestJS response body instead of the generic "Request failed".
 */
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const message: string =
            error?.response?.data?.message ??
            error?.message ??
            'Request failed';
        return Promise.reject(new Error(Array.isArray(message) ? message.join('; ') : message));
    },
);
