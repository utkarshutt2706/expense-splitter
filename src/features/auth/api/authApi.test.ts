import { describe, expect, it, vi } from 'vitest';

import type { User } from '@data/entities';
import { httpClient } from '@lib/api/httpClient';
import { changePassword, login, logout, refreshSession, register } from './authApi';

vi.mock('@lib/api/httpClient', () => ({
    httpClient: {
        post: vi.fn(),
        patch: vi.fn(),
    },
}));

const user: User = { id: 'current-user', name: 'Utkarsh Srivastava', email: 'utkarsh@example.com' };

describe('authApi', () => {
    it('login posts credentials to /auth/login and returns the session', async () => {
        vi.mocked(httpClient.post).mockResolvedValue({
            data: { user, accessToken: 'test-token' },
        });

        const session = await login({ email: 'utkarsh@example.com', password: 'password123' });

        expect(httpClient.post).toHaveBeenCalledWith('/auth/login', {
            email: 'utkarsh@example.com',
            password: 'password123',
        });
        expect(session).toEqual({ user, accessToken: 'test-token' });
    });

    it('register posts the new account details to /auth/register and returns the session', async () => {
        vi.mocked(httpClient.post).mockResolvedValue({
            data: { user, accessToken: 'test-token' },
        });

        const session = await register({
            name: 'Utkarsh Srivastava',
            email: 'utkarsh@example.com',
            phone: '9876543210',
            password: 'password123',
        });

        expect(httpClient.post).toHaveBeenCalledWith('/auth/register', {
            name: 'Utkarsh Srivastava',
            email: 'utkarsh@example.com',
            phone: '9876543210',
            password: 'password123',
        });
        expect(session).toEqual({ user, accessToken: 'test-token' });
    });

    it('changePassword patches the new credentials to /auth/password', async () => {
        vi.mocked(httpClient.patch).mockResolvedValue({ data: undefined });

        await changePassword({ currentPassword: 'old-password', newPassword: 'new-password' });

        expect(httpClient.patch).toHaveBeenCalledWith('/auth/password', {
            currentPassword: 'old-password',
            newPassword: 'new-password',
        });
    });

    it('restores a session from /auth/refresh', async () => {
        vi.mocked(httpClient.post).mockResolvedValue({
            data: { user, accessToken: 'refreshed-token' },
        });

        await expect(refreshSession()).resolves.toEqual({
            user,
            accessToken: 'refreshed-token',
        });
        expect(httpClient.post).toHaveBeenCalledWith('/auth/refresh', undefined, {
            headers: { 'X-Session-Request': 'ExpenseSplitter' },
        });
    });

    it('posts to /auth/logout to revoke the refresh session', async () => {
        vi.mocked(httpClient.post).mockResolvedValue({ data: undefined });

        await logout();

        expect(httpClient.post).toHaveBeenCalledWith('/auth/logout', undefined, {
            headers: { 'X-Session-Request': 'ExpenseSplitter' },
        });
    });
});
