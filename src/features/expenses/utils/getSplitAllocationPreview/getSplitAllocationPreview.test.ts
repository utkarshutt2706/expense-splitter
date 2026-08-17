import { describe, expect, it } from 'vitest';

import { getSplitAllocationPreview } from './getSplitAllocationPreview';

const participants = ['one', 'two'];

describe('getSplitAllocationPreview', () => {
    it('uses canonical cent allocation for an indivisible equal split', () => {
        const preview = getSplitAllocationPreview({
            amount: 100,
            participantUserIds: [...participants, 'three'],
            splitType: 'equal',
            splitValues: {},
        });

        expect(preview.summary).toBe(
            '2 participants receive ₹33.33 · 1 participant receives ₹33.34',
        );
        expect(Object.values(preview.resolvedAmounts).reduce((sum, value) => sum + value, 0)).toBe(
            100,
        );
    });

    it('does not calculate a preview without participants or a valid amount', () => {
        expect(
            getSplitAllocationPreview({
                amount: 100,
                participantUserIds: [],
                splitType: 'equal',
                splitValues: {},
            }).summary,
        ).toBe('Select at least one participant.');
        expect(
            getSplitAllocationPreview({
                amount: Number.NaN,
                participantUserIds: participants,
                splitType: 'equal',
                splitValues: {},
            }).resolvedAmounts,
        ).toEqual({});
    });

    it.each([
        [{ one: '50', two: '50' }, '₹100.00 assigned · Matches the expense total', 'valid'],
        [{ one: '40', two: '50' }, '₹90.00 assigned · ₹10.00 remaining', 'neutral'],
        [{ one: '60', two: '50' }, '₹110.00 assigned · ₹10.00 over the expense total', 'invalid'],
    ] as const)('summarizes exact allocations', (splitValues, summary, status) => {
        expect(
            getSplitAllocationPreview({
                amount: 100,
                participantUserIds: participants,
                splitType: 'exact',
                splitValues,
            }),
        ).toMatchObject({ summary, status });
    });

    it('summarizes percentage differences and resolves valid percentages in cents', () => {
        const valid = getSplitAllocationPreview({
            amount: 100,
            participantUserIds: [...participants, 'three'],
            splitType: 'percentage',
            splitValues: { one: '33.33', two: '33.33', three: '33.34' },
        });

        expect(valid.summary).toBe('100% assigned');
        expect(valid.resolvedAmounts).toEqual({ one: 33.33, two: 33.33, three: 33.34 });

        expect(
            getSplitAllocationPreview({
                amount: 100,
                participantUserIds: participants,
                splitType: 'percentage',
                splitValues: { one: '55', two: '55' },
            }).summary,
        ).toBe('110% assigned · 10% over');
    });

    it('resolves shares proportionally and requires every participant to have a positive share', () => {
        const valid = getSplitAllocationPreview({
            amount: 100,
            participantUserIds: participants,
            splitType: 'shares',
            splitValues: { one: '1', two: '2' },
        });

        expect(valid.summary).toBe('3 shares in total');
        expect(valid.resolvedAmounts).toEqual({ one: 33.33, two: 66.67 });

        const incomplete = getSplitAllocationPreview({
            amount: 100,
            participantUserIds: participants,
            splitType: 'shares',
            splitValues: { one: '1', two: '0' },
        });
        expect(incomplete.resolvedAmounts).toEqual({});
        expect(incomplete.summary).toContain('Enter a positive share for every participant');
    });

    it('reports invalid allocation values without producing invalid money output', () => {
        const preview = getSplitAllocationPreview({
            amount: 100,
            participantUserIds: participants,
            splitType: 'shares',
            splitValues: { one: '-1', two: 'nope' },
        });

        expect(preview.status).toBe('invalid');
        expect(preview.summary).not.toMatch(/NaN|Infinity/);
    });
});
