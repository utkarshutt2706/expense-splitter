import { describe, expect, it } from 'vitest';

import {
    bucketGroupSpending,
    contributionBalance,
    cumulativeNetPosition,
    niceTicks,
} from './analyticsMetrics';

describe('contributionBalance', () => {
    it('reports neither side when what you paid matches your share', () => {
        expect(contributionBalance(500, 500)).toEqual({ owed: 0, owe: 0 });
    });

    it('reports what you are owed when you paid more than your share', () => {
        expect(contributionBalance(800, 300)).toEqual({ owed: 500, owe: 0 });
    });

    it('reports what you owe when your share exceeds what you paid', () => {
        expect(contributionBalance(200, 900)).toEqual({ owed: 0, owe: 700 });
    });

    it('never reports both directions at once', () => {
        const { owed, owe } = contributionBalance(410.5, 120.25);

        expect(owed > 0 && owe > 0).toBe(false);
    });

    it('rounds away floating point dust rather than reporting a fractional imbalance', () => {
        expect(contributionBalance(0.1 + 0.2, 0.3)).toEqual({ owed: 0, owe: 0 });
    });

    it('treats negative inputs as zero rather than inverting the direction', () => {
        expect(contributionBalance(-50, 100)).toEqual({ owed: 0, owe: 100 });
    });
});

describe('cumulativeNetPosition', () => {
    const point = (actualPaid: number, currentUserShare: number) => ({
        actualPaid,
        currentUserShare,
    });

    it('carries the running position forward across buckets', () => {
        const result = cumulativeNetPosition([point(100, 50), point(0, 30), point(20, 20)]);

        expect(result.map((item) => item.net)).toEqual([50, -30, 0]);
        expect(result.map((item) => item.cumulative)).toEqual([50, 20, 20]);
    });

    it('crosses below zero once your share overtakes what you fronted', () => {
        const result = cumulativeNetPosition([point(100, 40), point(0, 200)]);

        expect(result.map((item) => item.cumulative)).toEqual([60, -140]);
    });

    it('keeps the original entry alongside the derived values', () => {
        const [first] = cumulativeNetPosition([point(10, 4)]);

        expect(first?.entry).toEqual({ actualPaid: 10, currentUserShare: 4 });
    });

    it('returns nothing for an empty series', () => {
        expect(cumulativeNetPosition([])).toEqual([]);
    });

    it('does not accumulate floating point error across many buckets', () => {
        const entries = Array.from({ length: 10 }, () => point(0.1, 0));

        expect(cumulativeNetPosition(entries).at(-1)?.cumulative).toBe(1);
    });
});

describe('bucketGroupSpending', () => {
    const trip = {
        groupId: 'trip',
        spendingByMonth: [
            { month: '2026-07', amount: 100 },
            { month: '2026-08', amount: 250 },
        ],
        spendingByDay: [{ date: '2026-08-02', amount: 250 }],
    };
    const flat = {
        groupId: 'flat',
        spendingByMonth: [{ month: '2026-08', amount: 80 }],
        spendingByDay: [{ date: '2026-08-01', amount: 80 }],
    };

    it('gives every group a column in every bucket, zero where it did not spend', () => {
        expect(bucketGroupSpending([trip, flat], 'month')).toEqual([
            { bucket: '2026-07', amounts: { trip: 100, flat: 0 } },
            { bucket: '2026-08', amounts: { trip: 250, flat: 80 } },
        ]);
    });

    it('orders buckets chronologically regardless of input order', () => {
        const reversed = {
            groupId: 'trip',
            spendingByMonth: [
                { month: '2026-12', amount: 5 },
                { month: '2026-02', amount: 5 },
            ],
        };

        expect(bucketGroupSpending([reversed], 'month').map((row) => row.bucket)).toEqual([
            '2026-02',
            '2026-12',
        ]);
    });

    it('buckets by day when asked, reading each daily series', () => {
        expect(bucketGroupSpending([trip, flat], 'day')).toEqual([
            { bucket: '2026-08-01', amounts: { trip: 0, flat: 80 } },
            { bucket: '2026-08-02', amounts: { trip: 250, flat: 0 } },
        ]);
    });

    it('treats a group with no daily series as having spent nothing that way', () => {
        const monthlyOnly = {
            groupId: 'legacy',
            spendingByMonth: [{ month: '2026-08', amount: 9 }],
        };

        expect(bucketGroupSpending([monthlyOnly], 'day')).toEqual([]);
    });

    it('sums repeated entries for the same bucket rather than overwriting', () => {
        const doubled = {
            groupId: 'trip',
            spendingByMonth: [
                { month: '2026-08', amount: 10.1 },
                { month: '2026-08', amount: 20.2 },
            ],
        };

        expect(bucketGroupSpending([doubled], 'month')).toEqual([
            { bucket: '2026-08', amounts: { trip: 30.3 } },
        ]);
    });

    it('returns nothing when there are no groups', () => {
        expect(bucketGroupSpending([], 'month')).toEqual([]);
    });
});

describe('niceTicks', () => {
    it('starts at zero and covers the maximum', () => {
        const ticks = niceTicks(38000);

        expect(ticks[0]).toBe(0);
        expect(ticks.at(-1)).toBeGreaterThanOrEqual(38000);
    });

    it('steps evenly, so a pinned axis can place labels by ratio', () => {
        const ticks = niceTicks(350);
        const steps = ticks.slice(1).map((tick, index) => tick - ticks[index]!);

        expect(new Set(steps).size).toBe(1);
    });

    it('chooses round steps rather than an exact division of the maximum', () => {
        expect(niceTicks(350)).toEqual([0, 100, 200, 300, 400]);
        expect(niceTicks(105000)).toEqual([0, 50000, 100000, 150000]);
    });

    it('collapses to a single tick when there is nothing to plot', () => {
        expect(niceTicks(0)).toEqual([0]);
        expect(niceTicks(-40)).toEqual([0]);
    });

    it('does not hand back an unusable scale for a non-finite maximum', () => {
        expect(niceTicks(Number.NaN)).toEqual([0]);
        expect(niceTicks(Number.POSITIVE_INFINITY)).toEqual([0]);
    });

    it('honours a requested tick count', () => {
        expect(niceTicks(100, 2).length).toBeLessThanOrEqual(4);
    });
});
