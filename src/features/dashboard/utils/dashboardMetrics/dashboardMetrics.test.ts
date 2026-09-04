import { describe, expect, it } from 'vitest';

import type { DashboardGroupSpend } from '@features/dashboard/api/dashboardApi';

import {
    combineDailySpending,
    combineMonthlySpending,
    comparisonScale,
    contributionCopy,
} from './dashboardMetrics';

function group(overrides: Partial<DashboardGroupSpend>): DashboardGroupSpend {
    return {
        groupId: 'group',
        name: 'Group',
        amount: 0,
        actualPaid: 0,
        currentUserShare: 0,
        currentBalance: 0,
        memberShares: [],
        spendingByMonth: [],
        ...overrides,
    };
}

describe('dashboardMetrics', () => {
    it.each([
        [120.126, 100.124, 'You paid ₹20.00 more than your share before settlements.'],
        [80, 100, 'You paid ₹20.00 less than your share before settlements.'],
        [100.004, 100, 'What you paid matches your share before settlements.'],
    ])('describes contribution differences', (paid, share, expected) => {
        expect(contributionCopy(paid, share)).toBe(expected);
    });

    it('uses the larger contribution as the comparison scale with a minimum of one', () => {
        expect(comparisonScale(20, 50)).toBe(50);
        expect(comparisonScale(75, 50)).toBe(75);
        expect(comparisonScale(0, 0)).toBe(1);
        expect(comparisonScale(-2, -3)).toBe(1);
    });

    it('combines matching months across groups, rounds totals, and sorts chronologically', () => {
        const groups = [
            group({
                groupId: 'one',
                spendingByMonth: [
                    { month: '2026-02', amount: 10.105, actualPaid: 7.105, currentUserShare: 3 },
                    { month: '2026-01', amount: 5, actualPaid: 2, currentUserShare: 3 },
                ],
            }),
            group({
                groupId: 'two',
                spendingByMonth: [
                    { month: '2026-02', amount: 2.106, actualPaid: 1.106, currentUserShare: 1 },
                ],
            }),
        ];

        expect(combineMonthlySpending(groups)).toEqual([
            { month: '2026-01', amount: 5, actualPaid: 2, currentUserShare: 3 },
            { month: '2026-02', amount: 12.22, actualPaid: 8.22, currentUserShare: 4 },
        ]);
    });

    it('combines and sorts daily spending while tolerating groups without daily data', () => {
        const groups = [
            group({
                groupId: 'one',
                spendingByDay: [
                    {
                        date: '2026-02-02',
                        amount: 4.555,
                        actualPaid: 3.335,
                        currentUserShare: 1.22,
                    },
                    { date: '2026-02-01', amount: 5, actualPaid: 2, currentUserShare: 3 },
                ],
            }),
            group({ groupId: 'missing', spendingByDay: undefined }),
            group({
                groupId: 'two',
                spendingByDay: [
                    {
                        date: '2026-02-02',
                        amount: 1.556,
                        actualPaid: 0.666,
                        currentUserShare: 0.89,
                    },
                ],
            }),
        ];

        expect(combineDailySpending(groups)).toEqual([
            { date: '2026-02-01', amount: 5, actualPaid: 2, currentUserShare: 3 },
            { date: '2026-02-02', amount: 6.12, actualPaid: 4.01, currentUserShare: 2.11 },
        ]);
    });

    it('returns empty combined series for empty groups', () => {
        expect(combineMonthlySpending([])).toEqual([]);
        expect(combineDailySpending([])).toEqual([]);
    });
});
