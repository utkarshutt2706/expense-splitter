import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import * as paymentsApi from '@features/payments/api/paymentsApi';
import { useDeletePayment } from './useDeletePayment';

vi.mock('@features/payments/api/paymentsApi', () => ({ remove: vi.fn() }));

describe('useDeletePayment', () => {
    it('deletes a payment and invalidates payment and balance queries', async () => {
        vi.mocked(paymentsApi.remove).mockResolvedValue(undefined);

        const queryClient = new QueryClient();
        const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
        const wrapper = ({ children }: { children: ReactNode }) => (
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        );
        const { result } = renderHook(() => useDeletePayment(), { wrapper });

        result.current.mutate({ groupId: 'group-1', id: 'payment-1' });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(paymentsApi.remove).toHaveBeenCalledWith('group-1', 'payment-1');
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['payments', 'group-1'] });
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['balances', 'group-1'] });
    });
});
