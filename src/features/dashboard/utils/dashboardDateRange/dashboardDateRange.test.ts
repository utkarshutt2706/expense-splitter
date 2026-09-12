import { describe, expect, it } from 'vitest';

import {
    customPeriod,
    dateInputValue,
    periodLabel,
    presetPeriod,
    usesDailyTrend,
} from './dashboardDateRange';

describe('dashboardDateRange', () => {
    const now = new Date(2026, 7, 17, 12);

    it('creates an unbounded all-time period', () => {
        expect(presetPeriod('all-time', now)).toEqual({
            preset: 'all-time',
            label: 'Overall',
        });
    });

    it.each([
        ['this-month', new Date(2026, 7, 1), new Date(2026, 8, 1)],
        ['previous-month', new Date(2026, 6, 1), new Date(2026, 7, 1)],
        ['last-three-months', new Date(2026, 5, 1), new Date(2026, 8, 1)],
        ['this-year', new Date(2026, 0, 1), new Date(2027, 0, 1)],
    ] as const)('creates the %s calendar range', (preset, start, end) => {
        expect(presetPeriod(preset, now).range).toEqual({
            from: start.toISOString(),
            to: end.toISOString(),
        });
    });

    it('treats the custom end date as inclusive', () => {
        const period = customPeriod('2026-08-01', '2026-08-17', now);
        expect(period.range).toEqual({
            from: new Date('2026-08-01T00:00:00').toISOString(),
            to: new Date('2026-08-18T00:00:00').toISOString(),
        });
        expect(period.label).toBe(
            `${new Date('2026-08-01T00:00:00').toLocaleDateString()} – ${new Date('2026-08-17T00:00:00').toLocaleDateString()}`,
        );
    });

    it.each([
        [new Date(2026, 7, 17, 12), new Date(2026, 6, 19), new Date(2026, 7, 18)],
        [new Date(2026, 0, 5, 23, 59), new Date(2025, 11, 7), new Date(2026, 0, 6)],
        [new Date(2024, 2, 1, 12), new Date(2024, 1, 1), new Date(2024, 2, 2)],
        [new Date(2026, 2, 15, 12), new Date(2026, 1, 14), new Date(2026, 2, 16)],
    ])('includes today and the preceding 29 local calendar days from %s', (today, start, end) => {
        const period = presetPeriod('last-30-days', today);
        expect(period).toEqual({
            preset: 'last-30-days',
            label: 'Last 30 days',
            range: { from: start.toISOString(), to: end.toISOString() },
        });
        expect(usesDailyTrend(period)).toBe(true);
    });

    it('rejects reversed and longer-than-one-year custom ranges', () => {
        expect(() => customPeriod('2026-08-02', '2026-08-01', now)).toThrow('Start date');
        expect(() => customPeriod('2026-01-01', '2027-01-01', now)).toThrow(
            'cannot exceed one year',
        );
    });

    it.each([
        ['', '2026-08-01'],
        ['2026-08-01', ''],
        ['not-a-date', '2026-08-01'],
    ])('rejects incomplete or invalid custom dates (%s, %s)', (start, end) => {
        expect(() => customPeriod(start, end, now)).toThrow('Choose a start and end date.');
    });

    it('rejects custom dates after today', () => {
        expect(() => customPeriod('2026-08-01', '2026-08-18', now)).toThrow('after today');
        expect(() => customPeriod('2026-08-18', '2026-08-18', now)).toThrow('after today');
    });

    it('uses daily trends for month presets and custom ranges up to one calendar month', () => {
        expect(usesDailyTrend(presetPeriod('this-month', now))).toBe(true);
        expect(usesDailyTrend(presetPeriod('previous-month', now))).toBe(true);
        expect(usesDailyTrend(presetPeriod('last-three-months', now))).toBe(false);
        expect(usesDailyTrend(customPeriod('2024-01-31', '2024-02-29', now))).toBe(true);
        expect(usesDailyTrend(customPeriod('2026-03-31', '2026-04-30', now))).toBe(true);
        expect(usesDailyTrend(customPeriod('2026-06-01', '2026-07-02', now))).toBe(false);
        expect(usesDailyTrend({ preset: 'custom', label: 'Custom' })).toBe(false);
    });

    it('formats local calendar input values and exposes every preset label', () => {
        expect(dateInputValue(new Date(2026, 0, 9))).toBe('2026-01-09');
        expect(periodLabel('this-year')).toBe('This year');
        expect(periodLabel('custom')).toBe('Custom date range');
    });
});
