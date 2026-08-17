import { describe, expect, it } from 'vitest';

import { addSingletonEndpoints } from './spendingTrendChartData';

const point = {
    period: '2026-08-17',
    label: '17 Aug 2026',
    amount: 111_100,
    actualPaid: 100_100,
    currentUserShare: 104_275,
};

describe('addSingletonEndpoints', () => {
    it('surrounds a single daily point with zero-value adjacent dates', () => {
        expect(addSingletonEndpoints([point], 'day', (period) => `${period} label`)).toEqual([
            {
                ...point,
                period: '2026-08-16',
                label: '2026-08-16 label',
                amount: 0,
                actualPaid: 0,
                currentUserShare: 0,
            },
            point,
            {
                ...point,
                period: '2026-08-18',
                label: '2026-08-18 label',
                amount: 0,
                actualPaid: 0,
                currentUserShare: 0,
            },
        ]);
    });

    it('handles month and year boundaries for monthly data', () => {
        const monthlyPoint = { ...point, period: '2026-01', label: 'Jan 26' };

        const result = addSingletonEndpoints([monthlyPoint], 'month', (period) => period);

        expect(result.map(({ period, amount }) => ({ period, amount }))).toEqual([
            { period: '2025-12', amount: 0 },
            { period: '2026-01', amount: 111_100 },
            { period: '2026-02', amount: 0 },
        ]);
    });

    it('does not alter a series with multiple real points', () => {
        const points = [point, { ...point, period: '2026-08-18' }];

        expect(addSingletonEndpoints(points, 'day', (period) => period)).toBe(points);
    });
});
