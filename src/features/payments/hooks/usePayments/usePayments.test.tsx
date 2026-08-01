import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import type { Payment } from '@data/entities';
import { usePayments } from './usePayments';

vi.mock('@services/instances', () => ({
    paymentService: {
        getByGroupId: vi.fn(),
    },
}));

const olderPayment: Payment = {
    id: 'payment-1',
    groupId: 'group-1',
    fromUserId: 'current-user',
    toUserId: 'friend-1',
    amount: 30,
    createdAt: '2026-07-01T00:00:00.000Z',
};

const newerPayment: Payment = {
    id: 'payment-2',
    groupId: 'group-1',
    fromUserId: 'friend-1',
    toUserId: 'current-user',
    amount: 20,
    createdAt: '2026-07-02T00:00:00.000Z',
};

function renderUsePayments(groupId: string) {
    const queryClient = new QueryClient();
    const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    return renderHook(() => usePayments(groupId), { wrapper });
}

describe('usePayments', () => {
    it('fetches payments for the given group, newest first', async () => {
        const { paymentService } = await import('@services/instances');
        vi.mocked(paymentService.getByGroupId).mockResolvedValue([olderPayment, newerPayment]);

        const { result } = renderUsePayments('group-1');

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(paymentService.getByGroupId).toHaveBeenCalledWith('group-1');
        expect(result.current.data).toEqual([newerPayment, olderPayment]);
    });
});
