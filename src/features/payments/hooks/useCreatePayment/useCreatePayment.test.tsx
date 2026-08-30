import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import type { Payment } from '@features/payments/api/paymentsApi';
import * as paymentsApi from '@features/payments/api/paymentsApi';
import { useCreatePayment } from './useCreatePayment';

vi.mock('@features/payments/api/paymentsApi', () => ({
    create: vi.fn(),
}));

describe('useCreatePayment', () => {
    it('creates a payment via the API and invalidates the group payments list', async () => {
        const created: Payment = {
            id: 'server-generated-id',
            groupId: 'group-1',
            fromUserId: 'user-1',
            toUserId: 'user-2',
            amount: 45,
            createdAt: '2026-07-01T00:00:00.000Z',
        };
        vi.mocked(paymentsApi.create).mockResolvedValue(created);

        const queryClient = new QueryClient();
        const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
        const wrapper = ({ children }: { children: ReactNode }) => (
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        );

        const { result } = renderHook(() => useCreatePayment(), { wrapper });

        result.current.mutate({
            groupId: 'group-1',
            fromUserId: 'user-1',
            toUserId: 'user-2',
            amount: 45,
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(paymentsApi.create).toHaveBeenCalledWith('group-1', {
            fromUserId: 'user-1',
            toUserId: 'user-2',
            amount: 45,
        });
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['payments', 'group-1'] });
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['balances', 'group-1'] });
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['dashboard'] });
    });
});
