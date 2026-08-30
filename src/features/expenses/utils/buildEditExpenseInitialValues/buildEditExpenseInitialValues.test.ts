import { describe, expect, it } from 'vitest';

import type { Expense } from '@features/expenses/api/expensesApi';
import { buildEditExpenseInitialValues } from './buildEditExpenseInitialValues';

function makeExpense(overrides: Partial<Expense>): Expense {
    return {
        id: 'expense-1',
        groupId: 'group-1',
        description: 'Dinner',
        amount: 100,
        paidByUserId: 'user-1',
        splitType: 'equal',
        splits: [
            { userId: 'user-1', amount: 50 },
            { userId: 'user-2', amount: 50 },
        ],
        createdAt: '2026-01-01T00:00:00.000Z',
        ...overrides,
    };
}

describe('buildEditExpenseInitialValues', () => {
    it('carries over the top-level fields unchanged', () => {
        const expense = makeExpense({});

        const values = buildEditExpenseInitialValues(expense);

        expect(values.description).toBe('Dinner');
        expect(values.amount).toBe(100);
        expect(values.paidByUserId).toBe('user-1');
        expect(values.participantUserIds).toEqual(['user-1', 'user-2']);
        expect(values.splitType).toBe('equal');
    });

    it('leaves splitValues empty for an equal split', () => {
        const values = buildEditExpenseInitialValues(makeExpense({ splitType: 'equal' }));

        expect(values.splitValues).toEqual({});
    });

    it('carries over exact dollar amounts as splitValues', () => {
        const expense = makeExpense({
            splitType: 'exact',
            splits: [
                { userId: 'user-1', amount: 30 },
                { userId: 'user-2', amount: 70 },
            ],
        });

        const values = buildEditExpenseInitialValues(expense);

        expect(values.splitValues).toEqual({ 'user-1': '30', 'user-2': '70' });
    });

    it('converts splits back to percentages of the total amount', () => {
        const expense = makeExpense({
            amount: 200,
            splitType: 'percentage',
            splits: [
                { userId: 'user-1', amount: 50 },
                { userId: 'user-2', amount: 150 },
            ],
        });

        const values = buildEditExpenseInitialValues(expense);

        expect(values.splitValues).toEqual({ 'user-1': '25.00', 'user-2': '75.00' });
    });

    it('leaves splitValues empty for a shares split, since share counts are not recoverable', () => {
        const values = buildEditExpenseInitialValues(makeExpense({ splitType: 'shares' }));

        expect(values.splitValues).toEqual({});
    });
});
