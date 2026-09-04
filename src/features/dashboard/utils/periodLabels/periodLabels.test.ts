import { describe, expect, it } from 'vitest';

import { dayLabel, monthLabel, shortDayLabel } from './periodLabels';

describe('periodLabels', () => {
    it.each([
        ['2026-01', 'Jan 26'],
        ['2026-09', 'Sept 26'],
        ['2025-12', 'Dec 25'],
    ])('formats month bucket %s', (month, expected) => {
        expect(monthLabel(month)).toBe(expected);
    });

    it.each([
        ['2026-01-01', '1 Jan 2026'],
        ['2024-02-29', '29 Feb 2024'],
        ['2025-12-31', '31 Dec 2025'],
    ])('formats full day bucket %s', (date, expected) => {
        expect(dayLabel(date)).toBe(expected);
    });

    it.each([
        ['2026-01-01', '1 Jan'],
        ['2024-02-29', '29 Feb'],
        ['2025-12-31', '31 Dec'],
    ])('formats short day bucket %s', (date, expected) => {
        expect(shortDayLabel(date)).toBe(expected);
    });
});
