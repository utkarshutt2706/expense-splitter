import { describe, expect, it } from 'vitest';

import {
    SplitCalculationError,
    calculateEqualSplit,
    calculateExactSplit,
    calculatePercentageSplit,
    calculateSharesSplit,
} from './splitCalculator';

describe('calculateEqualSplit', () => {
    it('splits an evenly divisible amount into equal shares', () => {
        const result = calculateEqualSplit({
            amount: 90,
            participantUserIds: ['user-1', 'user-2', 'user-3'],
        });

        expect(result).toEqual([
            { userId: 'user-1', amount: 30 },
            { userId: 'user-2', amount: 30 },
            { userId: 'user-3', amount: 30 },
        ]);
    });

    it('gives the leftover pennies to whoever rounded down the most, keeping the total exact', () => {
        const result = calculateEqualSplit({
            amount: 10,
            participantUserIds: ['user-1', 'user-2', 'user-3'],
        });

        expect(result).toEqual([
            { userId: 'user-1', amount: 3.34 },
            { userId: 'user-2', amount: 3.33 },
            { userId: 'user-3', amount: 3.33 },
        ]);
        expect(result.reduce((sum, split) => sum + split.amount, 0)).toBeCloseTo(10, 5);
    });

    it('assigns the full amount to a single participant', () => {
        const result = calculateEqualSplit({ amount: 42.5, participantUserIds: ['user-1'] });

        expect(result).toEqual([{ userId: 'user-1', amount: 42.5 }]);
    });

    it('throws when there are no participants', () => {
        expect(() => calculateEqualSplit({ amount: 10, participantUserIds: [] })).toThrow(
            SplitCalculationError,
        );
    });
});

describe('calculateExactSplit', () => {
    it('returns the given amounts when they add up to the total', () => {
        const result = calculateExactSplit({
            amount: 100,
            splits: [
                { userId: 'user-1', amount: 60 },
                { userId: 'user-2', amount: 40 },
            ],
        });

        expect(result).toEqual([
            { userId: 'user-1', amount: 60 },
            { userId: 'user-2', amount: 40 },
        ]);
    });

    it('throws when the amounts do not add up to the total', () => {
        expect(() =>
            calculateExactSplit({
                amount: 100,
                splits: [
                    { userId: 'user-1', amount: 60 },
                    { userId: 'user-2', amount: 39.98 },
                ],
            }),
        ).toThrow(SplitCalculationError);
    });

    it('throws when there are no participants', () => {
        expect(() => calculateExactSplit({ amount: 10, splits: [] })).toThrow(
            SplitCalculationError,
        );
    });
});

describe('calculatePercentageSplit', () => {
    it('splits by percentage when they add up to 100', () => {
        const result = calculatePercentageSplit({
            amount: 100,
            splits: [
                { userId: 'user-1', percentage: 60 },
                { userId: 'user-2', percentage: 40 },
            ],
        });

        expect(result).toEqual([
            { userId: 'user-1', amount: 60 },
            { userId: 'user-2', amount: 40 },
        ]);
    });

    it('gives the leftover pennies to whoever rounded down the most', () => {
        const result = calculatePercentageSplit({
            amount: 10,
            splits: [
                { userId: 'user-1', percentage: 33.33 },
                { userId: 'user-2', percentage: 33.33 },
                { userId: 'user-3', percentage: 33.34 },
            ],
        });

        expect(result).toEqual([
            { userId: 'user-1', amount: 3.33 },
            { userId: 'user-2', amount: 3.33 },
            { userId: 'user-3', amount: 3.34 },
        ]);
        expect(result.reduce((sum, split) => sum + split.amount, 0)).toBeCloseTo(10, 5);
    });

    it('throws when percentages do not add up to 100', () => {
        expect(() =>
            calculatePercentageSplit({
                amount: 100,
                splits: [
                    { userId: 'user-1', percentage: 60 },
                    { userId: 'user-2', percentage: 30 },
                ],
            }),
        ).toThrow(SplitCalculationError);
    });

    it('throws when there are no participants', () => {
        expect(() => calculatePercentageSplit({ amount: 10, splits: [] })).toThrow(
            SplitCalculationError,
        );
    });
});

describe('calculateSharesSplit', () => {
    it('splits proportionally to each participant’s shares', () => {
        const result = calculateSharesSplit({
            amount: 30,
            splits: [
                { userId: 'user-1', shares: 1 },
                { userId: 'user-2', shares: 2 },
            ],
        });

        expect(result).toEqual([
            { userId: 'user-1', amount: 10 },
            { userId: 'user-2', amount: 20 },
        ]);
    });

    it('gives the leftover penny to whoever rounded down the most', () => {
        const result = calculateSharesSplit({
            amount: 10.01,
            splits: [
                { userId: 'user-1', shares: 1 },
                { userId: 'user-2', shares: 2 },
            ],
        });

        expect(result).toEqual([
            { userId: 'user-1', amount: 3.34 },
            { userId: 'user-2', amount: 6.67 },
        ]);
        expect(result.reduce((sum, split) => sum + split.amount, 0)).toBeCloseTo(10.01, 5);
    });

    it('throws when a share is zero or negative', () => {
        expect(() =>
            calculateSharesSplit({
                amount: 10,
                splits: [
                    { userId: 'user-1', shares: 1 },
                    { userId: 'user-2', shares: 0 },
                ],
            }),
        ).toThrow(SplitCalculationError);
    });

    it('throws when there are no participants', () => {
        expect(() => calculateSharesSplit({ amount: 10, splits: [] })).toThrow(
            SplitCalculationError,
        );
    });
});
