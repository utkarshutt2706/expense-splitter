import { describe, expect, it } from 'vitest';

import { validateSplitInput } from './expenseSplitInput';

describe('validateSplitInput', () => {
    const participants = ['user-1', 'user-2'];

    it('accepts equal splits without requiring per-participant values', () => {
        expect(validateSplitInput('equal', 25, participants, {})).toEqual({});
    });

    it.each([
        ['exact', {}, 'Enter an amount for every participant'],
        [
            'percentage',
            { 'user-1': '100', 'user-2': '' },
            'Enter a percentage for every participant',
        ],
        ['shares', { 'user-1': '1', 'user-2': '0' }, 'Enter a share count for every participant'],
        ['shares', { 'user-1': '1', 'user-2': '-2' }, 'Enter a share count for every participant'],
        [
            'shares',
            { 'user-1': '1', 'user-2': 'not-a-number' },
            'Enter a share count for every participant',
        ],
    ] as const)('rejects invalid %s values', (splitType, values, error) => {
        expect(validateSplitInput(splitType, 100, participants, values)).toEqual({ error });
    });

    it('requires exact amounts to equal the expense total at cent precision', () => {
        expect(
            validateSplitInput('exact', 25, participants, {
                'user-1': '10',
                'user-2': '14.99',
            }),
        ).toEqual({ error: 'Exact amounts must add up to the total expense amount' });

        expect(
            validateSplitInput('exact', 10.004, participants, {
                'user-1': '5.004',
                'user-2': '5.001',
            }),
        ).toEqual({
            values: [
                { userId: 'user-1', value: 5.004 },
                { userId: 'user-2', value: 5.001 },
            ],
        });
    });

    it('accepts percentages within the tolerance and rejects totals outside it', () => {
        expect(
            validateSplitInput('percentage', 100, participants, {
                'user-1': '33.33',
                'user-2': '66.679',
            }),
        ).toEqual({
            values: [
                { userId: 'user-1', value: 33.33 },
                { userId: 'user-2', value: 66.679 },
            ],
        });
        expect(
            validateSplitInput('percentage', 100, participants, {
                'user-1': '33.33',
                'user-2': '66.681',
            }),
        ).toEqual({ error: 'Split percentages must add up to 100' });
    });

    it('returns parsed exact and share values in participant order', () => {
        expect(
            validateSplitInput('exact', 25, participants, {
                'user-2': '15',
                'user-1': '10',
            }),
        ).toEqual({
            values: [
                { userId: 'user-1', value: 10 },
                { userId: 'user-2', value: 15 },
            ],
        });
        expect(
            validateSplitInput('shares', 25, participants, {
                'user-1': '1.5',
                'user-2': '2',
            }),
        ).toEqual({
            values: [
                { userId: 'user-1', value: 1.5 },
                { userId: 'user-2', value: 2 },
            ],
        });
    });
});
