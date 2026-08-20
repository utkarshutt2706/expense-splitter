import { describe, expect, it } from 'vitest';

import { formatCompactCurrency, formatCurrency } from './formatCurrency';

describe('formatCurrency', () => {
    it.each([
        [0, '₹0.00'],
        [-0, '₹0.00'],
        [7.78, '₹7.78'],
        [180, '₹180.00'],
        [1414, '₹1,414.00'],
        [9388.09, '₹9,388.09'],
        [34674.13, '₹34,674.13'],
        [129438.2, '₹1,29,438.20'],
        [1234567.89, '₹12,34,567.89'],
        [-2500, '-₹2,500.00'],
    ])('formats %s as %s', (value, expected) => {
        expect(formatCurrency(value)).toBe(expected);
    });

    it.each([undefined, null, Number.NaN, Number.POSITIVE_INFINITY, '100'])(
        'shows unavailable for invalid or missing value %s',
        (value) => {
            expect(formatCurrency(value)).toBe('—');
        },
    );
});

describe('formatCompactCurrency', () => {
    it('keeps large amounts short enough for a chart axis gutter', () => {
        // The full form is ₹1,05,000.00 — twelve characters, which the axis clips.
        expect(formatCompactCurrency(105000)).toBe('₹1.1L');
        expect(formatCompactCurrency(140000)).toBe('₹1.4L');
    });

    it('uses the lakh and crore scale readers here expect', () => {
        expect(formatCompactCurrency(35000)).toBe('₹35K');
        expect(formatCompactCurrency(12345678)).toBe('₹1.2Cr');
    });

    it('leaves small amounts unabbreviated', () => {
        expect(formatCompactCurrency(0)).toBe('₹0');
        expect(formatCompactCurrency(999)).toBe('₹999');
    });

    it('renders negative amounts without losing the sign', () => {
        expect(formatCompactCurrency(-35000)).toBe('-₹35K');
    });

    it('falls back to a dash for values that are not finite numbers', () => {
        expect(formatCompactCurrency(Number.NaN)).toBe('—');
        expect(formatCompactCurrency(undefined)).toBe('—');
    });
});
