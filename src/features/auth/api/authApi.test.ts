import { describe, expect, it, vi } from 'vitest';

import type { User } from '@data/entities';
import { httpClient } from '@lib/api/httpClient';
import { login, register } from './authApi';

vi.mock('@lib/api/httpClient', () => ({
    httpClient: {
        post: vi.fn(),
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
            password: 'password123',
        });

        expect(httpClient.post).toHaveBeenCalledWith('/auth/register', {
            name: 'Utkarsh Srivastava',
            email: 'utkarsh@example.com',
            password: 'password123',
        });
        expect(session).toEqual({ user, accessToken: 'test-token' });
    });

    it('register forwards an inviteToken when given one', async () => {
        vi.mocked(httpClient.post).mockResolvedValue({
            data: { user, accessToken: 'test-token' },
        });

        await register({
            name: 'Utkarsh Srivastava',
            email: 'utkarsh@example.com',
            password: 'password123',
            inviteToken: 'raw-token',
        });

        expect(httpClient.post).toHaveBeenCalledWith('/auth/register', {
            name: 'Utkarsh Srivastava',
            email: 'utkarsh@example.com',
            password: 'password123',
            inviteToken: 'raw-token',
        });
    });
});
