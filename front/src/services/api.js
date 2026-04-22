import axios from 'axios';

export const normalizeApiBaseUrl = (rawBaseUrl) => {
    const fallbackBaseUrl = 'http://localhost:3000/api';

    if (!rawBaseUrl) {
        if (typeof window !== 'undefined' && window.location?.origin) {
            return `${window.location.origin}/api`;
        }

        return fallbackBaseUrl;
    }

    try {
        const parsedUrl = new URL(rawBaseUrl);
        const normalizedPath = parsedUrl.pathname.replace(/\/+$/, '');

        if (normalizedPath === '/api' || normalizedPath.startsWith('/api/')) {
            return `${parsedUrl.origin}${normalizedPath}`;
        }

        if (normalizedPath.endsWith('/api')) {
            console.warn(
                `[api] VITE_API_URL estava apontando para "${rawBaseUrl}". ` +
                'Ajustando automaticamente para o endpoint raiz "/api".'
            );
            return `${parsedUrl.origin}/api`;
        }

        return `${parsedUrl.origin}${normalizedPath}`;
    } catch {
        return rawBaseUrl.replace(/\/+$/, '');
    }
};

const api = axios.create({
    baseURL: normalizeApiBaseUrl(import.meta.env.VITE_API_URL),
    timeout: 10000,
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('@WebWallet:token');

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            console.error('Token invalido ou expirado. Refaca o login.');
        }

        return Promise.reject(error);
    }
);

export default api;
