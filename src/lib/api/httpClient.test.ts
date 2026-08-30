import type { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { AxiosHeaders } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '@app/stores';
import type { User } from '@data/entities';
import { attachAuthHeader, handleResponseError, httpClient } from './httpClient';

const refreshedUser: User = {
    id: 'current-user',
    name: 'Alex Morgan',
    email: 'alex@example.com',
};

function unauthorizedError(url = '/groups', sessionRefreshAttempted = false): AxiosError {
    return {
        name: 'AxiosError',
        message: 'Request failed',
        isAxiosError: true,
        toJSON: () => ({}),
        config: {
            url,
            headers: new AxiosHeaders(),
            _sessionRefreshAttempted: sessionRefreshAttempted,
        } as InternalAxiosRequestConfig,
        response: {
            status: 401,
            data: { error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' } },
        } as AxiosError['response'],
    } as AxiosError;
}

describe('httpClient', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        localStorage.clear();
        useAuthStore.setState({ currentUserId: null, cachedUser: null, accessToken: null });
    });

    it('is configured with the API base URL', () => {
        expect(httpClient.defaults.baseURL).toBe(import.meta.env.VITE_API_BASE_URL);
        expect(httpClient.defaults.withCredentials).toBe(true);
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

        it('refreshes the session and retries the original request after a 401', async () => {
            const adapter = vi.fn(async (config: InternalAxiosRequestConfig) => ({
                data: { retried: true },
                status: 200,
                statusText: 'OK',
                headers: new AxiosHeaders(),
                config,
            }));
            const error = unauthorizedError();
            error.config!.adapter = adapter;
            vi.spyOn(httpClient, 'post').mockResolvedValue({
                data: { user: refreshedUser, accessToken: 'refreshed-token' },
            } as AxiosResponse);

            const response = (await handleResponseError(error)) as AxiosResponse;

            expect(httpClient.post).toHaveBeenCalledWith('/auth/refresh', undefined, {
                headers: { 'X-Session-Request': 'ExpenseSplitter' },
            });
            expect(adapter).toHaveBeenCalledOnce();
            expect(response.data).toEqual({ retried: true });
            expect(error.config!.headers.get('Authorization')).toBe('Bearer refreshed-token');
            expect(useAuthStore.getState()).toMatchObject({
                currentUserId: refreshedUser.id,
                cachedUser: refreshedUser,
                accessToken: 'refreshed-token',
            });
        });

        it('logs out when the refresh cookie no longer represents a session', async () => {
            useAuthStore.getState().login(refreshedUser, 'expired-token');
            vi.spyOn(httpClient, 'post').mockResolvedValue({ data: null } as AxiosResponse);

            await expect(handleResponseError(unauthorizedError())).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });

            expect(useAuthStore.getState().currentUserId).toBeNull();
            expect(useAuthStore.getState().accessToken).toBeNull();
        });

        it('does not retry a request that already attempted session refresh', async () => {
            useAuthStore.getState().login(refreshedUser, 'expired-token');
            const refresh = vi.spyOn(httpClient, 'post');

            await expect(
                handleResponseError(unauthorizedError('/groups', true)),
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });

            expect(refresh).not.toHaveBeenCalled();
            expect(useAuthStore.getState().currentUserId).toBeNull();
        });

        it.each(['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'])(
            'does not refresh a failed session endpoint: %s',
            async (url) => {
                useAuthStore.getState().login(refreshedUser, 'expired-token');
                const refresh = vi.spyOn(httpClient, 'post');

                await expect(handleResponseError(unauthorizedError(url))).rejects.toMatchObject({
                    code: 'UNAUTHORIZED',
                });

                expect(refresh).not.toHaveBeenCalled();
                expect(useAuthStore.getState().currentUserId).toBeNull();
            },
        );

        it('shares one refresh request between concurrent unauthorized responses', async () => {
            const adapter = vi.fn(async (config: InternalAxiosRequestConfig) => ({
                data: { retried: true },
                status: 200,
                statusText: 'OK',
                headers: new AxiosHeaders(),
                config,
            }));
            const firstError = unauthorizedError('/groups/one');
            const secondError = unauthorizedError('/groups/two');
            firstError.config!.adapter = adapter;
            secondError.config!.adapter = adapter;
            const refresh = vi.spyOn(httpClient, 'post').mockResolvedValue({
                data: { user: refreshedUser, accessToken: 'refreshed-token' },
            } as AxiosResponse);

            await Promise.all([handleResponseError(firstError), handleResponseError(secondError)]);

            expect(refresh).toHaveBeenCalledOnce();
            expect(adapter).toHaveBeenCalledTimes(2);
        });
    });
});
