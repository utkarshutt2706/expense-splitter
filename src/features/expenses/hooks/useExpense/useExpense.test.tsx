import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import type { Expense } from '@data/entities';
import * as expensesApi from '@features/expenses/api/expensesApi';
import { useExpense } from './useExpense';

vi.mock('@features/expenses/api/expensesApi', () => ({
    getById: vi.fn(),
}));

function renderUseExpense(groupId: string, id: string) {
    const queryClient = new QueryClient();
    const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    return renderHook(() => useExpense(groupId, id), { wrapper });
}

describe('useExpense', () => {
    it('returns the expense with the given id', async () => {
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
        vi.mocked(expensesApi.getById).mockResolvedValue(expense);

        const { result } = renderUseExpense('group-1', 'expense-1');

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data).toEqual(expense);
        expect(expensesApi.getById).toHaveBeenCalledWith('group-1', 'expense-1');
    });

    it('does not fetch when the id is empty', () => {
        const { result } = renderUseExpense('group-1', '');

        expect(result.current.fetchStatus).toBe('idle');
    });

    it('does not fetch when the group id is empty', () => {
        const { result } = renderUseExpense('', 'expense-1');

        expect(result.current.fetchStatus).toBe('idle');
    });
});
