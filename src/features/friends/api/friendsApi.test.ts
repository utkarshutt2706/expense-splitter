import { describe, expect, it, vi } from 'vitest';

import type { User } from '@data/entities';
import { httpClient } from '@lib/api/httpClient';
import { getFriends } from './friendsApi';

vi.mock('@lib/api/httpClient', () => ({
    httpClient: {
        get: vi.fn(),
    },
}));

const friend: User = { id: 'friend-1', name: 'Priya Sharma', email: 'priya@example.com' };

describe('friendsApi', () => {
    it('getFriends fetches the derived friend list from /users/me/friends', async () => {
        vi.mocked(httpClient.get).mockResolvedValue({ data: [friend] });

        const friends = await getFriends();

        expect(httpClient.get).toHaveBeenCalledWith('/users/me/friends');
        expect(friends).toEqual([friend]);
    });
});
