import { describe, expect, it } from 'vitest';

import { contributionBalanceLabel } from './contributionBalanceLabel';

describe('contributionBalanceLabel', () => {
    it('reports an amount owed to the current user', () => {
        expect(contributionBalanceLabel(1250.5, 0)).toBe('You are owed ₹1,250.50');
    });

    it('reports an amount the current user owes', () => {
        expect(contributionBalanceLabel(0, 725.25)).toBe('You owe ₹725.25');
    });

    it('prioritizes a positive owed amount when both inputs are positive', () => {
        expect(contributionBalanceLabel(100, 50)).toBe('You are owed ₹100.00');
    });

    it.each([
        [0, 0],
        [-10, 0],
        [0, -10],
        [-10, -20],
    ])('reports a level position for non-positive values (%s, %s)', (owed, owe) => {
        expect(contributionBalanceLabel(owed, owe)).toBe('Level with your share');
    });
});
