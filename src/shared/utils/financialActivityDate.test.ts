import { describe, expect, it } from 'vitest';

import { compareFinancialActivityNewestFirst } from './financialActivityDate';

describe('compareFinancialActivityNewestFirst', () => {
    it('orders different paid dates newest first', () => {
        const olderPaidDate = {
            paidOn: '2026-08-29T00:00:00.000Z',
            createdAt: '2026-08-30T12:00:00.000Z',
        };
        const newerPaidDate = {
            paidOn: '2026-08-30T00:00:00.000Z',
            createdAt: '2026-08-29T12:00:00.000Z',
        };

        expect([olderPaidDate, newerPaidDate].sort(compareFinancialActivityNewestFirst)).toEqual([
            newerPaidDate,
            olderPaidDate,
        ]);
    });

    it('uses creation time to order records with the same date-only paid value', () => {
        const earlier = {
            paidOn: '2026-08-30T00:00:00.000Z',
            createdAt: '2026-08-30T09:00:00.000Z',
        };
        const later = {
            paidOn: '2026-08-30T00:00:00.000Z',
            createdAt: '2026-08-30T17:00:00.000Z',
        };

        expect([earlier, later].sort(compareFinancialActivityNewestFirst)).toEqual([
            later,
            earlier,
        ]);
    });

    it('falls back to creation time when paidOn is absent', () => {
        const earlier = { createdAt: '2026-08-30T09:00:00.000Z' };
        const later = { createdAt: '2026-08-30T17:00:00.000Z' };

        expect([earlier, later].sort(compareFinancialActivityNewestFirst)).toEqual([
            later,
            earlier,
        ]);
    });
});
