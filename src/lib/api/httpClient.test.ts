import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { AxiosHeaders } from 'axios';
import { beforeEach, describe, expect, it } from 'vitest';

import { useAuthStore } from '@app/stores';
import { attachAuthHeader, handleResponseError, httpClient } from './httpClient';

describe('httpClient', () => {
    beforeEach(() => {
        localStorage.clear();
        useAuthStore.setState({ currentUserId: null, cachedUser: null, accessToken: null });
    });

    it('is configured with the API base URL', () => {
        expect(httpClient.defaults.baseURL).toBe(import.meta.env.VITE_API_BASE_URL);
    });

    describe('attachAuthHeader', () => {
        it('adds an Authorization header when an access token is present', () => {
            useAuthStore.setState({ accessToken: 'test-token' });
            const config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig;

            const result = attachAuthHeader(config);

            expect(result.headers.get('Authorization')).toBe('Bearer test-token');
        });

        it('leaves the Authorization header unset when there is no access token', () => {
            const config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig;

            const result = attachAuthHeader(config);

            expect(result.headers.get('Authorization')).toBeUndefined();
        });
    });

    describe('handleResponseError', () => {
        it('logs out and rejects with an ApiError on a 401', async () => {
            useAuthStore.setState({ currentUserId: 'current-user', accessToken: 'expired-token' });
            const error = {
                name: 'AxiosError',
                message: 'Request failed',
                isAxiosError: true,
                toJSON: () => ({}),
                response: {
                    status: 401,
                    data: { error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' } },
                } as AxiosError['response'],
            } as AxiosError;

            await expect(handleResponseError(error)).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
                message: 'Invalid or expired token',
            });
            expect(useAuthStore.getState().currentUserId).toBeNull();
            expect(useAuthStore.getState().accessToken).toBeNull();
        });

        it('does not log out on a non-401 error', async () => {
            useAuthStore.setState({ currentUserId: 'current-user', accessToken: 'valid-token' });
            const error = {
                name: 'AxiosError',
                message: 'Request failed',
                isAxiosError: true,
                toJSON: () => ({}),
                response: {
                    status: 404,
                    data: { error: { code: 'NOT_FOUND', message: 'Group not found' } },
                } as AxiosError['response'],
            } as AxiosError;

            await expect(handleResponseError(error)).rejects.toMatchObject({ code: 'NOT_FOUND' });
            expect(useAuthStore.getState().currentUserId).toBe('current-user');
            expect(useAuthStore.getState().accessToken).toBe('valid-token');
        });
    });
});
