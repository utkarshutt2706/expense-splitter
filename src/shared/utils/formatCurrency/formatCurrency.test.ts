import { describe, expect, it } from 'vitest';

import { formatCurrency } from './formatCurrency';

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
