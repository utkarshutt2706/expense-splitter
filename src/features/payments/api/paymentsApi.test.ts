import { describe, expect, it, vi } from 'vitest';

import type { Payment } from '@data/entities';
import { httpClient } from '@lib/api/httpClient';
import { create, getByGroupId } from './paymentsApi';

vi.mock('@lib/api/httpClient', () => ({
    httpClient: {
        get: vi.fn(),
        post: vi.fn(),
    },
}));

const payment: Payment = {
    id: 'payment-1',
    groupId: 'group-1',
    fromUserId: 'user-1',
    toUserId: 'user-2',
    amount: 45,
    createdAt: '2026-07-01T00:00:00.000Z',
};

describe('paymentsApi', () => {
    it('getByGroupId fetches the payment list from /groups/:groupId/payments', async () => {
        vi.mocked(httpClient.get).mockResolvedValue({ data: [payment] });

        const payments = await getByGroupId('group-1');

        expect(httpClient.get).toHaveBeenCalledWith('/groups/group-1/payments');
        expect(payments).toEqual([payment]);
    });

    it('create posts a new payment to /groups/:groupId/payments', async () => {
        vi.mocked(httpClient.post).mockResolvedValue({ data: payment });

        const result = await create('group-1', {
            fromUserId: 'user-1',
            toUserId: 'user-2',
            amount: 45,
        });

        expect(httpClient.post).toHaveBeenCalledWith('/groups/group-1/payments', {
            fromUserId: 'user-1',
            toUserId: 'user-2',
            amount: 45,
        });
        expect(result).toEqual(payment);
    });
});
