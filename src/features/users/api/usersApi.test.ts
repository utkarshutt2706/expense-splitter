import { describe, expect, it, vi } from 'vitest';

import type { User } from '@data/entities';
import { httpClient } from '@lib/api/httpClient';
import { getByIds, lookup } from './usersApi';

vi.mock('@lib/api/httpClient', () => ({
    httpClient: {
        post: vi.fn(),
        get: vi.fn(),
    },
}));

const users: User[] = [
    { id: 'user-1', name: 'Priya Sharma', email: 'priya@example.com' },
    { id: 'user-2', name: 'Jordan Lee', email: 'jordan@example.com' },
];

describe('usersApi', () => {
    it('getByIds posts the id list to /users/batch and returns matching users', async () => {
        vi.mocked(httpClient.post).mockResolvedValue({ data: users });

        const result = await getByIds(['user-1', 'user-2']);

        expect(httpClient.post).toHaveBeenCalledWith('/users/batch', {
            ids: ['user-1', 'user-2'],
        });
        expect(result).toEqual(users);
    });

    it('lookup gets /users/lookup with an email query param', async () => {
        vi.mocked(httpClient.get).mockResolvedValue({ data: users[0] });

        const result = await lookup({ email: 'priya@example.com' });

        expect(httpClient.get).toHaveBeenCalledWith('/users/lookup', {
            params: { email: 'priya@example.com' },
        });
        expect(result).toEqual(users[0]);
    });

    it('lookup gets /users/lookup with a phone query param', async () => {
        vi.mocked(httpClient.get).mockResolvedValue({ data: users[1] });

        const result = await lookup({ phone: '9876543210' });

        expect(httpClient.get).toHaveBeenCalledWith('/users/lookup', {
            params: { phone: '9876543210' },
        });
        expect(result).toEqual(users[1]);
    });
});
