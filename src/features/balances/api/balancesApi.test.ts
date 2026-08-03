import { describe, expect, it, vi } from 'vitest';

import { httpClient } from '@lib/api/httpClient';
import { getByGroupId, type GroupBalances } from './balancesApi';

vi.mock('@lib/api/httpClient', () => ({
    httpClient: {
        get: vi.fn(),
    },
}));

const groupBalances: GroupBalances = {
    balances: [
        { userId: 'current-user', balance: -20 },
        { userId: 'friend-1', balance: 20 },
    ],
    settlements: [{ fromUserId: 'current-user', toUserId: 'friend-1', amount: 20 }],
};

describe('balancesApi', () => {
    it('getByGroupId fetches balances and settlements from /groups/:groupId/balances', async () => {
        vi.mocked(httpClient.get).mockResolvedValue({ data: groupBalances });

        const result = await getByGroupId('group-1');

        expect(httpClient.get).toHaveBeenCalledWith('/groups/group-1/balances');
        expect(result).toEqual(groupBalances);
    });
});
