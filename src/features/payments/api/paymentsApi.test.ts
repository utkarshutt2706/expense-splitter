import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Payment } from './paymentsApi';
import { httpClient } from '@lib/api/httpClient';
import { create, getByGroupId, remove, update } from './paymentsApi';

vi.mock('@lib/api/httpClient', () => ({
    httpClient: {
        get: vi.fn(),
        post: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn(),
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
    beforeEach(() => {
        vi.resetAllMocks();
    });

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

    it('update patches the payment at /groups/:groupId/payments/:id', async () => {
        const updated = { ...payment, amount: 60 };
        vi.mocked(httpClient.patch).mockResolvedValue({ data: updated });

        const result = await update('group-1', 'payment-1', {
            fromUserId: 'user-1',
            toUserId: 'user-2',
            amount: 60,
        });

        expect(httpClient.patch).toHaveBeenCalledWith('/groups/group-1/payments/payment-1', {
            fromUserId: 'user-1',
            toUserId: 'user-2',
            amount: 60,
        });
        expect(result).toEqual(updated);
    });

    it('remove deletes the payment at /groups/:groupId/payments/:id', async () => {
        vi.mocked(httpClient.delete).mockResolvedValue({});

        await expect(remove('group-1', 'payment-1')).resolves.toBeUndefined();

        expect(httpClient.delete).toHaveBeenCalledWith('/groups/group-1/payments/payment-1');
    });

    it('preserves empty payment lists and complete payment fields from the server', async () => {
        const completePayment = { ...payment, paidOn: '2026-06-30' };
        vi.mocked(httpClient.get)
            .mockResolvedValueOnce({ data: [] })
            .mockResolvedValueOnce({ data: [completePayment] });

        await expect(getByGroupId('empty-group')).resolves.toEqual([]);
        await expect(getByGroupId('group-1')).resolves.toEqual([completePayment]);
    });

    it.each([
        ['getByGroupId', () => getByGroupId('group-1'), httpClient.get],
        [
            'create',
            () => create('group-1', { fromUserId: 'user-1', toUserId: 'user-2', amount: 45 }),
            httpClient.post,
        ],
        [
            'update',
            () =>
                update('group-1', 'payment-1', {
                    fromUserId: 'user-1',
                    toUserId: 'user-2',
                    amount: 45,
                }),
            httpClient.patch,
        ],
        ['remove', () => remove('group-1', 'payment-1'), httpClient.delete],
    ] as const)('propagates %s transport failures unchanged', async (_name, request, method) => {
        const failure = new Error('Network unavailable');
        vi.mocked(method).mockRejectedValue(failure);

        await expect(request()).rejects.toBe(failure);
    });
});
