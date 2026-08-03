import { describe, expect, it, vi } from 'vitest';

import type { User } from '@data/entities';
import { httpClient } from '@lib/api/httpClient';
import { create, getAll, remove, update } from './friendsApi';

vi.mock('@lib/api/httpClient', () => ({
    httpClient: {
        get: vi.fn(),
        post: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn(),
    },
}));

const friend: User = { id: 'friend-1', name: 'Priya Sharma', email: 'priya@example.com' };

describe('friendsApi', () => {
    it('getAll fetches the user list from /users', async () => {
        vi.mocked(httpClient.get).mockResolvedValue({ data: [friend] });

        const users = await getAll();

        expect(httpClient.get).toHaveBeenCalledWith('/users');
        expect(users).toEqual([friend]);
    });

    it('create posts a new user to /users', async () => {
        vi.mocked(httpClient.post).mockResolvedValue({ data: friend });

        const result = await create({ name: 'Priya Sharma', email: 'priya@example.com' });

        expect(httpClient.post).toHaveBeenCalledWith('/users', {
            name: 'Priya Sharma',
            email: 'priya@example.com',
        });
        expect(result).toEqual(friend);
    });

    it('update patches the user at /users/:id', async () => {
        const updated = { ...friend, name: 'Priya S.' };
        vi.mocked(httpClient.patch).mockResolvedValue({ data: updated });

        const result = await update('friend-1', { name: 'Priya S.' });

        expect(httpClient.patch).toHaveBeenCalledWith('/users/friend-1', { name: 'Priya S.' });
        expect(result).toEqual(updated);
    });

    it('remove deletes the user at /users/:id', async () => {
        vi.mocked(httpClient.delete).mockResolvedValue({ data: undefined });

        await remove('friend-1');

        expect(httpClient.delete).toHaveBeenCalledWith('/users/friend-1');
    });
});
