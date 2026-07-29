import { describe, expect, it } from 'vitest';

import { resolveSplits } from './resolveSplits';

describe('resolveSplits', () => {
    it('calculates an equal split when the split type is equal', () => {
        const splits = resolveSplits({
            splitType: 'equal',
            amount: 90,
            participantUserIds: ['user-1', 'user-2', 'user-3'],
        });

        expect(splits).toEqual([
            { userId: 'user-1', amount: 30 },
            { userId: 'user-2', amount: 30 },
            { userId: 'user-3', amount: 30 },
        ]);
    });

    it('calculates an exact split when exactSplits are provided', () => {
        const splits = resolveSplits({
            splitType: 'exact',
            amount: 90,
            participantUserIds: ['user-1', 'user-2'],
            exactSplits: [
                { userId: 'user-1', amount: 50 },
                { userId: 'user-2', amount: 40 },
            ],
        });

        expect(splits).toEqual([
            { userId: 'user-1', amount: 50 },
            { userId: 'user-2', amount: 40 },
        ]);
    });

    it('calculates a percentage split when percentageSplits are provided', () => {
        const splits = resolveSplits({
            splitType: 'percentage',
            amount: 90,
            participantUserIds: ['user-1', 'user-2'],
            percentageSplits: [
                { userId: 'user-1', percentage: 60 },
                { userId: 'user-2', percentage: 40 },
            ],
        });

        expect(splits).toEqual([
            { userId: 'user-1', amount: 54 },
            { userId: 'user-2', amount: 36 },
        ]);
    });

    it('calculates a shares split when sharesSplits are provided', () => {
        const splits = resolveSplits({
            splitType: 'shares',
            amount: 90,
            participantUserIds: ['user-1', 'user-2'],
            sharesSplits: [
                { userId: 'user-1', shares: 2 },
                { userId: 'user-2', shares: 1 },
            ],
        });

        expect(splits).toEqual([
            { userId: 'user-1', amount: 60 },
            { userId: 'user-2', amount: 30 },
        ]);
    });

    it('falls back to an equal split when the exact splits are missing', () => {
        const splits = resolveSplits({
            splitType: 'exact',
            amount: 90,
            participantUserIds: ['user-1', 'user-2', 'user-3'],
        });

        expect(splits).toEqual([
            { userId: 'user-1', amount: 30 },
            { userId: 'user-2', amount: 30 },
            { userId: 'user-3', amount: 30 },
        ]);
    });
});
