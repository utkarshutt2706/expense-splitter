import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { useDeleteExpense } from './useDeleteExpense';

vi.mock('@services/instances', () => ({
    expenseService: {
        delete: vi.fn(),
    },
}));

describe('useDeleteExpense', () => {
    it('deletes the expense and invalidates the group expense list', async () => {
        const { expenseService } = await import('@services/instances');
        vi.mocked(expenseService.delete).mockResolvedValue(undefined);

        const queryClient = new QueryClient();
        const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
        const wrapper = ({ children }: { children: ReactNode }) => (
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        );

        const { result } = renderHook(() => useDeleteExpense(), { wrapper });

        result.current.mutate({ id: 'expense-1', groupId: 'group-1' });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(expenseService.delete).toHaveBeenCalledWith('expense-1');
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['expenses', 'group-1'] });
    });
});
