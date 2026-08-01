import { describe, expect, it } from 'vitest';

import type { Expense, Payment } from '@data/entities';
import { calculateNetBalance } from './calculateNetBalance';

function expense(overrides: Partial<Expense>): Expense {
    return {
        id: 'expense-1',
        groupId: 'group-1',
        description: 'Groceries',
        amount: 100,
        paidByUserId: 'user-1',
        splitType: 'equal',
        splits: [],
        createdAt: '2026-07-01T00:00:00.000Z',
        ...overrides,
    };
}

function payment(overrides: Partial<Payment>): Payment {
    return {
        id: 'payment-1',
        groupId: 'group-1',
        fromUserId: 'user-1',
        toUserId: 'user-2',
        amount: 30,
        createdAt: '2026-07-02T00:00:00.000Z',
        ...overrides,
    };
}

describe('calculateNetBalance', () => {
    it('returns a positive balance when the user paid for others', () => {
        const expenses = [
            expense({
                paidByUserId: 'user-1',
                amount: 90,
                splits: [
                    { userId: 'user-1', amount: 30 },
                    { userId: 'user-2', amount: 30 },
                    { userId: 'user-3', amount: 30 },
                ],
            }),
        ];

        expect(calculateNetBalance(expenses, [], 'user-1')).toBe(60);
    });

    it('returns a negative balance when the user owes someone else', () => {
        const expenses = [
            expense({
                paidByUserId: 'user-2',
                amount: 90,
                splits: [
                    { userId: 'user-1', amount: 30 },
                    { userId: 'user-2', amount: 30 },
                    { userId: 'user-3', amount: 30 },
                ],
            }),
        ];

        expect(calculateNetBalance(expenses, [], 'user-1')).toBe(-30);
    });

    it('returns zero when there are no expenses or payments', () => {
        expect(calculateNetBalance([], [], 'user-1')).toBe(0);
    });

    it('returns zero when the user is not involved in any expense', () => {
        const expenses = [
            expense({
                paidByUserId: 'user-2',
                amount: 20,
                splits: [
                    { userId: 'user-2', amount: 10 },
                    { userId: 'user-3', amount: 10 },
                ],
            }),
        ];

        expect(calculateNetBalance(expenses, [], 'user-1')).toBe(0);
    });

    it('nets out across multiple expenses in both directions', () => {
        const expenses = [
            expense({
                paidByUserId: 'user-1',
                amount: 60,
                splits: [
                    { userId: 'user-1', amount: 30 },
                    { userId: 'user-2', amount: 30 },
                ],
            }),
            expense({
                paidByUserId: 'user-2',
                amount: 20,
                splits: [
                    { userId: 'user-1', amount: 10 },
                    { userId: 'user-2', amount: 10 },
                ],
            }),
        ];

        expect(calculateNetBalance(expenses, [], 'user-1')).toBe(20);
    });

    it('does not count the payer’s own share as money owed to them', () => {
        const expenses = [
            expense({
                paidByUserId: 'user-1',
                amount: 30,
                splits: [{ userId: 'user-1', amount: 30 }],
            }),
        ];

        expect(calculateNetBalance(expenses, [], 'user-1')).toBe(0);
    });

    it('increases the sender’s balance and decreases the recipient’s by a payment amount', () => {
        const payments = [payment({ fromUserId: 'user-1', toUserId: 'user-2', amount: 25 })];

        expect(calculateNetBalance([], payments, 'user-1')).toBe(25);
        expect(calculateNetBalance([], payments, 'user-2')).toBe(-25);
    });

    it('ignores payments the user is not a party to', () => {
        const payments = [payment({ fromUserId: 'user-2', toUserId: 'user-3', amount: 25 })];

        expect(calculateNetBalance([], payments, 'user-1')).toBe(0);
    });

    it('settles a debt when a payment exactly offsets an expense', () => {
        const expenses = [
            expense({
                paidByUserId: 'user-2',
                amount: 60,
                splits: [
                    { userId: 'user-1', amount: 30 },
                    { userId: 'user-2', amount: 30 },
                ],
            }),
        ];
        const payments = [payment({ fromUserId: 'user-1', toUserId: 'user-2', amount: 30 })];

        expect(calculateNetBalance(expenses, payments, 'user-1')).toBe(0);
        expect(calculateNetBalance(expenses, payments, 'user-2')).toBe(0);
    });
});
