import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import type { Expense } from '@data/entities';
import { useExpense } from './useExpense';

vi.mock('@services/instances', () => ({
    expenseService: {
        getById: vi.fn(),
    },
}));

describe('useExpense', () => {
    it('returns the expense with the given id', async () => {
        const { expenseService } = await import('@services/instances');
        const expense: Expense = {
            id: 'expense-1',
            groupId: 'group-1',
            description: 'Dinner',
            amount: 60,
            paidByUserId: 'user-1',
            splitType: 'equal',
            splits: [
                { userId: 'user-1', amount: 30 },
                { userId: 'user-2', amount: 30 },
            ],
            createdAt: '2026-07-25T00:00:00.000Z',
        };
        vi.mocked(expenseService.getById).mockResolvedValue(expense);

        const queryClient = new QueryClient();
        const wrapper = ({ children }: { children: ReactNode }) => (
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        );

        const { result } = renderHook(() => useExpense('expense-1'), { wrapper });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data).toEqual(expense);
        expect(expenseService.getById).toHaveBeenCalledWith('expense-1');
    });

    it('does not fetch when the id is empty', () => {
        const queryClient = new QueryClient();
        const wrapper = ({ children }: { children: ReactNode }) => (
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        );

        const { result } = renderHook(() => useExpense(''), { wrapper });

        expect(result.current.fetchStatus).toBe('idle');
    });
});
