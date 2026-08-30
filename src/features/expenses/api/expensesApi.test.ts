import { describe, expect, it, vi } from 'vitest';

import type { Expense } from './expensesApi';
import { httpClient } from '@lib/api/httpClient';
import { create, getByGroupId, getById, remove, update } from './expensesApi';

vi.mock('@lib/api/httpClient', () => ({
    httpClient: {
        get: vi.fn(),
        post: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn(),
    },
}));

const expense: Expense = {
    id: 'expense-1',
    groupId: 'group-1',
    description: 'Groceries',
    amount: 90,
    paidByUserId: 'user-1',
    splitType: 'equal',
    splits: [
        { userId: 'user-1', amount: 45 },
        { userId: 'user-2', amount: 45 },
    ],
    createdAt: '2026-07-01T00:00:00.000Z',
};

describe('expensesApi', () => {
    it('getByGroupId fetches the expense list from /groups/:groupId/expenses', async () => {
        vi.mocked(httpClient.get).mockResolvedValue({ data: [expense] });

        const expenses = await getByGroupId('group-1');

        expect(httpClient.get).toHaveBeenCalledWith('/groups/group-1/expenses');
        expect(expenses).toEqual([expense]);
    });

    it('getById fetches a single expense from /groups/:groupId/expenses/:expenseId', async () => {
        vi.mocked(httpClient.get).mockResolvedValue({ data: expense });

        const result = await getById('group-1', 'expense-1');

        expect(httpClient.get).toHaveBeenCalledWith('/groups/group-1/expenses/expense-1');
        expect(result).toEqual(expense);
    });

    it('create posts a new expense to /groups/:groupId/expenses', async () => {
        vi.mocked(httpClient.post).mockResolvedValue({ data: expense });

        const result = await create('group-1', {
            description: 'Groceries',
            amount: 90,
            paidByUserId: 'user-1',
            splitType: 'equal',
            splits: expense.splits,
        });

        expect(httpClient.post).toHaveBeenCalledWith('/groups/group-1/expenses', {
            description: 'Groceries',
            amount: 90,
            paidByUserId: 'user-1',
            splitType: 'equal',
            splits: expense.splits,
        });
        expect(result).toEqual(expense);
    });

    it('update patches the expense at /groups/:groupId/expenses/:expenseId', async () => {
        const updated = { ...expense, description: 'Groceries (updated)' };
        vi.mocked(httpClient.patch).mockResolvedValue({ data: updated });

        const result = await update('group-1', 'expense-1', {
            description: 'Groceries (updated)',
            amount: 90,
            paidByUserId: 'user-1',
            splitType: 'equal',
            splits: expense.splits,
        });

        expect(httpClient.patch).toHaveBeenCalledWith('/groups/group-1/expenses/expense-1', {
            description: 'Groceries (updated)',
            amount: 90,
            paidByUserId: 'user-1',
            splitType: 'equal',
            splits: expense.splits,
        });
        expect(result).toEqual(updated);
    });

    it('remove deletes the expense at /groups/:groupId/expenses/:expenseId', async () => {
        vi.mocked(httpClient.delete).mockResolvedValue({ data: undefined });

        await remove('group-1', 'expense-1');

        expect(httpClient.delete).toHaveBeenCalledWith('/groups/group-1/expenses/expense-1');
    });
});
