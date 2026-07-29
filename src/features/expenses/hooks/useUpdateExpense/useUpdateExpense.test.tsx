import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import type { Expense } from '@data/entities';
import { useUpdateExpense } from './useUpdateExpense';

vi.mock('@services/instances', () => ({
    expenseService: {
        update: vi.fn(),
    },
}));

describe('useUpdateExpense', () => {
    it('updates the expense with a recalculated equal split', async () => {
        const { expenseService } = await import('@services/instances');
        const updated: Expense = {
            id: 'expense-1',
            groupId: 'group-1',
            description: 'Groceries',
            amount: 90,
            paidByUserId: 'user-2',
            splitType: 'equal',
            splits: [
                { userId: 'user-1', amount: 45 },
                { userId: 'user-2', amount: 45 },
            ],
            createdAt: '2026-07-01T00:00:00.000Z',
        };
        vi.mocked(expenseService.update).mockResolvedValue(updated);

        const queryClient = new QueryClient();
        const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
        const wrapper = ({ children }: { children: ReactNode }) => (
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        );

        const { result } = renderHook(() => useUpdateExpense(), { wrapper });

        result.current.mutate({
            id: 'expense-1',
            groupId: 'group-1',
            description: 'Groceries',
            amount: 90,
            paidByUserId: 'user-2',
            participantUserIds: ['user-1', 'user-2'],
            splitType: 'equal',
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(expenseService.update).toHaveBeenCalledWith('expense-1', {
            description: 'Groceries',
            amount: 90,
            paidByUserId: 'user-2',
            splitType: 'equal',
            splits: [
                { userId: 'user-1', amount: 45 },
                { userId: 'user-2', amount: 45 },
            ],
        });
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['expenses', 'group-1'] });
        expect(invalidateSpy).toHaveBeenCalledWith({
            queryKey: ['expenses', 'detail', 'expense-1'],
        });
    });

    it('updates the expense with a recalculated exact split', async () => {
        const { expenseService } = await import('@services/instances');
        const updated: Expense = {
            id: 'expense-1',
            groupId: 'group-1',
            description: 'Groceries',
            amount: 90,
            paidByUserId: 'user-2',
            splitType: 'exact',
            splits: [
                { userId: 'user-1', amount: 50 },
                { userId: 'user-2', amount: 40 },
            ],
            createdAt: '2026-07-01T00:00:00.000Z',
        };
        vi.mocked(expenseService.update).mockResolvedValue(updated);

        const queryClient = new QueryClient();
        const wrapper = ({ children }: { children: ReactNode }) => (
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        );

        const { result } = renderHook(() => useUpdateExpense(), { wrapper });

        result.current.mutate({
            id: 'expense-1',
            groupId: 'group-1',
            description: 'Groceries',
            amount: 90,
            paidByUserId: 'user-2',
            participantUserIds: ['user-1', 'user-2'],
            splitType: 'exact',
            exactSplits: [
                { userId: 'user-1', amount: 50 },
                { userId: 'user-2', amount: 40 },
            ],
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(expenseService.update).toHaveBeenCalledWith(
            'expense-1',
            expect.objectContaining({
                splitType: 'exact',
                splits: [
                    { userId: 'user-1', amount: 50 },
                    { userId: 'user-2', amount: 40 },
                ],
            }),
        );
    });
});
