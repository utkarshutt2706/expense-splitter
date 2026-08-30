import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import type { Expense } from '@data/entities';
import * as expensesApi from '@features/expenses/api/expensesApi';
import { useUpdateExpense } from './useUpdateExpense';

vi.mock('@features/expenses/api/expensesApi', () => ({
    update: vi.fn(),
}));

function renderUpdateExpense() {
    const queryClient = new QueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    return { ...renderHook(() => useUpdateExpense(), { wrapper }), invalidateSpy };
}

describe('useUpdateExpense', () => {
    it('updates the expense with a recalculated equal split', async () => {
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
        vi.mocked(expensesApi.update).mockResolvedValue(updated);

        const { result, invalidateSpy } = renderUpdateExpense();

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

        expect(expensesApi.update).toHaveBeenCalledWith('group-1', 'expense-1', {
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
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['balances', 'group-1'] });
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['dashboard'] });
    });

    it('updates the expense with a recalculated exact split', async () => {
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
        vi.mocked(expensesApi.update).mockResolvedValue(updated);

        const { result } = renderUpdateExpense();

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

        expect(expensesApi.update).toHaveBeenCalledWith(
            'group-1',
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

    it('updates the expense with a recalculated percentage split, forwarding the raw percentages', async () => {
        const updated: Expense = {
            id: 'expense-1',
            groupId: 'group-1',
            description: 'Groceries',
            amount: 90,
            paidByUserId: 'user-2',
            splitType: 'percentage',
            splits: [
                { userId: 'user-1', amount: 54 },
                { userId: 'user-2', amount: 36 },
            ],
            createdAt: '2026-07-01T00:00:00.000Z',
        };
        vi.mocked(expensesApi.update).mockResolvedValue(updated);

        const { result } = renderUpdateExpense();

        result.current.mutate({
            id: 'expense-1',
            groupId: 'group-1',
            description: 'Groceries',
            amount: 90,
            paidByUserId: 'user-2',
            participantUserIds: ['user-1', 'user-2'],
            splitType: 'percentage',
            percentageSplits: [
                { userId: 'user-1', percentage: 60 },
                { userId: 'user-2', percentage: 40 },
            ],
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(expensesApi.update).toHaveBeenCalledWith(
            'group-1',
            'expense-1',
            expect.objectContaining({
                splitType: 'percentage',
                percentages: [
                    { userId: 'user-1', percentage: 60 },
                    { userId: 'user-2', percentage: 40 },
                ],
            }),
        );
    });

    it('updates the expense with a recalculated shares split, forwarding the raw share counts', async () => {
        const updated: Expense = {
            id: 'expense-1',
            groupId: 'group-1',
            description: 'Groceries',
            amount: 90,
            paidByUserId: 'user-2',
            splitType: 'shares',
            splits: [
                { userId: 'user-1', amount: 60 },
                { userId: 'user-2', amount: 30 },
            ],
            createdAt: '2026-07-01T00:00:00.000Z',
        };
        vi.mocked(expensesApi.update).mockResolvedValue(updated);

        const { result } = renderUpdateExpense();

        result.current.mutate({
            id: 'expense-1',
            groupId: 'group-1',
            description: 'Groceries',
            amount: 90,
            paidByUserId: 'user-2',
            participantUserIds: ['user-1', 'user-2'],
            splitType: 'shares',
            sharesSplits: [
                { userId: 'user-1', shares: 2 },
                { userId: 'user-2', shares: 1 },
            ],
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(expensesApi.update).toHaveBeenCalledWith(
            'group-1',
            'expense-1',
            expect.objectContaining({
                splitType: 'shares',
                shares: [
                    { userId: 'user-1', shares: 2 },
                    { userId: 'user-2', shares: 1 },
                ],
            }),
        );
    });
});
