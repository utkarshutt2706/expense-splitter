import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import type { Expense } from '@features/expenses/api/expensesApi';
import * as expensesApi from '@features/expenses/api/expensesApi';
import { useExpenses } from './useExpenses';

vi.mock('@features/expenses/api/expensesApi', () => ({
    getByGroupId: vi.fn(),
}));

const olderExpense: Expense = {
    id: 'expense-1',
    groupId: 'group-1',
    description: 'Groceries',
    amount: 30,
    paidByUserId: 'current-user',
    splitType: 'equal',
    splits: [{ userId: 'current-user', amount: 30 }],
    paidOn: '2026-07-03T00:00:00.000Z',
    createdAt: '2026-07-01T00:00:00.000Z',
};

const newerExpense: Expense = {
    id: 'expense-2',
    groupId: 'group-1',
    description: 'Taxi',
    amount: 20,
    paidByUserId: 'friend-1',
    splitType: 'equal',
    splits: [{ userId: 'friend-1', amount: 20 }],
    paidOn: '2026-07-02T00:00:00.000Z',
    createdAt: '2026-07-02T00:00:00.000Z',
};

function renderUseExpenses(groupId: string) {
    const queryClient = new QueryClient();
    const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    return renderHook(() => useExpenses(groupId), { wrapper });
}

describe('useExpenses', () => {
    it('fetches expenses for the given group, newest first', async () => {
        vi.mocked(expensesApi.getByGroupId).mockResolvedValue([olderExpense, newerExpense]);

        const { result } = renderUseExpenses('group-1');

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(expensesApi.getByGroupId).toHaveBeenCalledWith('group-1');
        expect(result.current.data).toEqual([olderExpense, newerExpense]);
    });

    it('uses creation time to order expenses recorded for the same paid date', async () => {
        const laterRecordedExpense: Expense = {
            ...newerExpense,
            paidOn: olderExpense.paidOn,
            createdAt: '2026-07-04T12:00:00.000Z',
        };
        vi.mocked(expensesApi.getByGroupId).mockResolvedValue([olderExpense, laterRecordedExpense]);

        const { result } = renderUseExpenses('group-1');

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data).toEqual([laterRecordedExpense, olderExpense]);
    });
});
