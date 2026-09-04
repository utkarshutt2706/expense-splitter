import { describe, expect, it } from 'vitest';

import type { DashboardGroupSpend } from '@features/dashboard/api/dashboardApi';

import { periodPoints } from './periodPoints';

function group(overrides: Partial<DashboardGroupSpend> = {}): DashboardGroupSpend {
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

describe('periodPoints', () => {
    it('returns combined daily points when daily data is requested and available for every group', () => {
        const groups = [
            group({
                groupId: 'one',
                spendingByDay: [
                    { date: '2026-08-02', amount: 10, actualPaid: 8, currentUserShare: 4 },
                ],
            }),
            group({
                groupId: 'two',
                spendingByDay: [
                    { date: '2026-08-01', amount: 5, actualPaid: 2, currentUserShare: 3 },
                    { date: '2026-08-02', amount: 4, actualPaid: 1, currentUserShare: 2 },
                ],
            }),
        ];

        expect(periodPoints(groups, true)).toEqual({
            daily: true,
            points: [
                {
                    date: '2026-08-01',
                    label: '1 Aug',
                    amount: 5,
                    actualPaid: 2,
                    currentUserShare: 3,
                },
                {
                    date: '2026-08-02',
                    label: '2 Aug',
                    amount: 14,
                    actualPaid: 9,
                    currentUserShare: 6,
                },
            ],
        });
    });

    it('falls back to monthly points when any group lacks daily data', () => {
        const groups = [
            group({
                groupId: 'one',
                spendingByMonth: [
                    { month: '2026-08', amount: 10, actualPaid: 8, currentUserShare: 4 },
                ],
                spendingByDay: [],
            }),
            group({
                groupId: 'two',
                spendingByMonth: [
                    { month: '2026-07', amount: 5, actualPaid: 2, currentUserShare: 3 },
                    { month: '2026-08', amount: 4, actualPaid: 1, currentUserShare: 2 },
                ],
            }),
        ];

        expect(periodPoints(groups, true)).toEqual({
            daily: false,
            points: [
                {
                    month: '2026-07',
                    label: 'Jul 26',
                    amount: 5,
                    actualPaid: 2,
                    currentUserShare: 3,
                },
                {
                    month: '2026-08',
                    label: 'Aug 26',
                    amount: 14,
                    actualPaid: 9,
                    currentUserShare: 6,
                },
            ],
        });
    });

    it('uses monthly points when daily data is not requested', () => {
        const groups = [
            group({
                spendingByMonth: [
                    { month: '2026-08', amount: 10, actualPaid: 8, currentUserShare: 4 },
                ],
                spendingByDay: [
                    { date: '2026-08-01', amount: 10, actualPaid: 8, currentUserShare: 4 },
                ],
            }),
        ];

        expect(periodPoints(groups, false)).toEqual({
            daily: false,
            points: [
                {
                    month: '2026-08',
                    label: 'Aug 26',
                    amount: 10,
                    actualPaid: 8,
                    currentUserShare: 4,
                },
            ],
        });
    });

    it('returns an empty daily series for an empty group collection when requested', () => {
        expect(periodPoints([], true)).toEqual({ daily: true, points: [] });
    });
});
