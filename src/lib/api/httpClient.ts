import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

import { useAuthStore } from '@app/stores';
import type { User } from '@features/users/api/usersApi';
import { toApiError } from './apiError';

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
    _sessionRefreshAttempted?: boolean;
}

interface RefreshedSession {
    user: User;
    accessToken: string;
}

let sessionRefresh: Promise<RefreshedSession | null> | null = null;
const NON_REFRESHABLE_AUTH_ENDPOINTS = new Set([
    '/auth/login',
    '/auth/register',
    '/auth/refresh',
    '/auth/logout',
]);

function isNonRefreshableAuthEndpoint(url: string | undefined): boolean {
    if (!url) return false;
    const pathname = new URL(url, 'http://expense-splitter.local').pathname.replace(/\/$/, '');
    return NON_REFRESHABLE_AUTH_ENDPOINTS.has(pathname);
}

export function attachAuthHeader(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
    const { accessToken } = useAuthStore.getState();
    if (accessToken) {
        config.headers.set('Authorization', `Bearer ${accessToken}`);
    }
    return config;
}

// A 401 means the token is missing/expired — clear the session so AppLayout's
// existing currentUserId guard redirects to /login.
export async function handleResponseError(error: AxiosError): Promise<unknown> {
    const apiError = toApiError(error);
    const config = error.config as RetryableRequestConfig | undefined;
    const isUnauthorized = apiError.code === 'UNAUTHORIZED' || error.response?.status === 401;
    const isSessionEndpoint = isNonRefreshableAuthEndpoint(config?.url);

    if (!isUnauthorized || !config || isSessionEndpoint) {
        if (isUnauthorized) useAuthStore.getState().logout();
        throw apiError;
    }

    if (config._sessionRefreshAttempted) {
        useAuthStore.getState().logout();
        throw apiError;
    }
    config._sessionRefreshAttempted = true;

    sessionRefresh ??= httpClient
        .post<RefreshedSession | null>('/auth/refresh', undefined, {
            headers: { 'X-Session-Request': 'ExpenseSplitter' },
        })
        .then(({ data }) => data)
        .finally(() => {
            sessionRefresh = null;
        });

    const session = await sessionRefresh;
    if (!session) {
        useAuthStore.getState().logout();
        throw apiError;
    }

    useAuthStore.getState().login(session.user, session.accessToken);
    config.headers.set('Authorization', `Bearer ${session.accessToken}`);
    return httpClient(config);
}

export const httpClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    withCredentials: true,
});

httpClient.interceptors.request.use(attachAuthHeader);
httpClient.interceptors.response.use((response) => response, handleResponseError);
