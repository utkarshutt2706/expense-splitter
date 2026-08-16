import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import type { Payment } from '@data/entities';
import * as paymentsApi from '@features/payments/api/paymentsApi';
import { useUpdatePayment } from './useUpdatePayment';

vi.mock('@features/payments/api/paymentsApi', () => ({ update: vi.fn() }));

describe('useUpdatePayment', () => {
    it('updates a payment and invalidates payment and balance queries', async () => {
        const updated: Payment = {
            id: 'payment-1',
            groupId: 'group-1',
            fromUserId: 'user-1',
            toUserId: 'user-2',
            amount: 60,
            createdAt: '2026-07-01T00:00:00.000Z',
        };
        vi.mocked(paymentsApi.update).mockResolvedValue(updated);

        const queryClient = new QueryClient();
        const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
        const wrapper = ({ children }: { children: ReactNode }) => (
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        );
        const { result } = renderHook(() => useUpdatePayment(), { wrapper });

        result.current.mutate({
            groupId: 'group-1',
            id: 'payment-1',
            fromUserId: 'user-1',
            toUserId: 'user-2',
            amount: 60,
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(paymentsApi.update).toHaveBeenCalledWith('group-1', 'payment-1', {
            fromUserId: 'user-1',
            toUserId: 'user-2',
            amount: 60,
        });
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['payments', 'group-1'] });
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['balances', 'group-1'] });
    });
});
