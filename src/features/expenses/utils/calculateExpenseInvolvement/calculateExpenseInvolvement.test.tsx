import { describe, expect, it } from 'vitest';

import type { Expense } from '@data/entities';
import { calculateExpenseInvolvement } from './calculateExpenseInvolvement';

function expense(overrides: Partial<Expense>): Expense {
    return {
        id: 'expense-1',
        groupId: 'group-1',
        description: 'Groceries',
        amount: 90,
        paidByUserId: 'user-1',
        splitType: 'equal',
        splits: [],
        createdAt: '2026-07-01T00:00:00.000Z',
        ...overrides,
    };
}

describe('calculateExpenseInvolvement', () => {
    it('returns "lent" with the amount owed by others when the user paid', () => {
        const result = calculateExpenseInvolvement(
            expense({
                paidByUserId: 'user-1',
                splits: [
                    { userId: 'user-1', amount: 30 },
                    { userId: 'user-2', amount: 30 },
                    { userId: 'user-3', amount: 30 },
                ],
            }),
            'user-1',
        );

        expect(result).toEqual({ type: 'lent', amount: 60 });
    });

    it('returns "owed" with the user\'s own share when someone else paid', () => {
        const result = calculateExpenseInvolvement(
            expense({
                paidByUserId: 'user-2',
                splits: [
                    { userId: 'user-1', amount: 25 },
                    { userId: 'user-2', amount: 25 },
                ],
            }),
            'user-1',
        );

        expect(result).toEqual({ type: 'owed', amount: 25 });
    });

    it('returns "uninvolved" when the user neither paid nor has a split', () => {
        const result = calculateExpenseInvolvement(
            expense({
                paidByUserId: 'user-2',
                splits: [
                    { userId: 'user-2', amount: 20 },
                    { userId: 'user-3', amount: 20 },
                ],
            }),
            'user-1',
        );

        expect(result).toEqual({ type: 'uninvolved' });
    });

    it('returns "lent" with a zero amount when the user paid only for themselves', () => {
        const result = calculateExpenseInvolvement(
            expense({
                paidByUserId: 'user-1',
                splits: [{ userId: 'user-1', amount: 30 }],
            }),
            'user-1',
        );

        expect(result).toEqual({ type: 'lent', amount: 0 });
    });
});
