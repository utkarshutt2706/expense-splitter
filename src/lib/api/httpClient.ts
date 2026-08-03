import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

import { useAuthStore } from '@app/stores';
import { toApiError } from './apiError';

export function attachAuthHeader(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
    const { accessToken } = useAuthStore.getState();
    if (accessToken) {
        config.headers.set('Authorization', `Bearer ${accessToken}`);
    }
    return config;
}

// A 401 means the token is missing/expired — clear the session so AppLayout's
// existing currentUserId guard redirects to /login.
export function handleResponseError(error: AxiosError): Promise<never> {
    const apiError = toApiError(error);
    if (apiError.code === 'UNAUTHORIZED') {
        useAuthStore.getState().logout();
    }
    return Promise.reject(apiError);
}

export const httpClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
});

httpClient.interceptors.request.use(attachAuthHeader);
httpClient.interceptors.response.use((response) => response, handleResponseError);
