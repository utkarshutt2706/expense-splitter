import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import type { Payment } from '@data/entities';
import { useCreatePayment } from './useCreatePayment';

vi.mock('@services/instances', () => ({
    paymentService: {
        create: vi.fn(),
    },
}));

describe('useCreatePayment', () => {
    it('creates a payment from the given sender to the given recipient', async () => {
        const { paymentService } = await import('@services/instances');
        const created: Payment = {
            id: 'generated-id',
            groupId: 'group-1',
            fromUserId: 'user-1',
            toUserId: 'user-2',
            amount: 45,
            createdAt: '2026-07-01T00:00:00.000Z',
        };
        vi.mocked(paymentService.create).mockResolvedValue(created);

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

        expect(paymentService.create).toHaveBeenCalledWith(
            expect.objectContaining({
                groupId: 'group-1',
                fromUserId: 'user-1',
                toUserId: 'user-2',
                amount: 45,
            }),
        );
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['payments', 'group-1'] });
    });
});
