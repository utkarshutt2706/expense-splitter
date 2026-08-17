import { describe, expect, it, vi } from 'vitest';

import { httpClient } from '@lib/api/httpClient';
import { getFriends, type Friend } from './friendsApi';

vi.mock('@lib/api/httpClient', () => ({
    httpClient: {
        get: vi.fn(),
    },
}));

const friend: Friend = {
    id: 'friend-1',
    name: 'Priya Sharma',
    email: 'priya@example.com',
    sharedGroupCount: 2,
    netBalance: 125,
    groupBalances: [{ groupId: 'group-1', groupName: 'Goa Trip', balance: 125 }],
};

describe('friendsApi', () => {
    it('getFriends fetches the derived friend list from /users/me/friends', async () => {
        vi.mocked(httpClient.get).mockResolvedValue({ data: [friend] });

        const friends = await getFriends();

        expect(httpClient.get).toHaveBeenCalledWith('/users/me/friends');
        expect(friends).toEqual([friend]);
    });
});
