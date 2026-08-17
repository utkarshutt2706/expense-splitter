import { describe, expect, it } from 'vitest';

import { customPeriod, presetPeriod } from './dashboardDateRange';

describe('dashboardDateRange', () => {
    const now = new Date(2026, 7, 17, 12);

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

    it('rejects reversed and longer-than-one-year custom ranges', () => {
        expect(() => customPeriod('2026-08-02', '2026-08-01', now)).toThrow('Start date');
        expect(() => customPeriod('2026-01-01', '2027-01-01', now)).toThrow(
            'cannot exceed one year',
        );
    });

    it('rejects custom dates after today', () => {
        expect(() => customPeriod('2026-08-01', '2026-08-18', now)).toThrow('after today');
        expect(() => customPeriod('2026-08-18', '2026-08-18', now)).toThrow('after today');
    });
});
