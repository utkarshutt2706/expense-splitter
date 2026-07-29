import { describe, expect, it } from 'vitest';

import { simplifyDebts } from './simplifyDebts';

describe('simplifyDebts', () => {
    it('settles a single debtor against a single creditor', () => {
        const result = simplifyDebts([
            { userId: 'a', amount: -100 },
            { userId: 'b', amount: 100 },
        ]);

        expect(result).toEqual([{ fromUserId: 'a', toUserId: 'b', amount: 100 }]);
    });

    it('collapses a chain through a member who nets to zero', () => {
        // A owes B 50, B owes C 50 — B nets to zero and should disappear entirely,
        // leaving a single direct A -> C transaction instead of two.
        const result = simplifyDebts([
            { userId: 'a', amount: -50 },
            { userId: 'b', amount: 0 },
            { userId: 'c', amount: 50 },
        ]);

        expect(result).toEqual([{ fromUserId: 'a', toUserId: 'c', amount: 50 }]);
    });

    it('uses the minimum number of transactions for multiple debtors and one creditor', () => {
        const result = simplifyDebts([
            { userId: 'a', amount: -30 },
            { userId: 'b', amount: -20 },
            { userId: 'c', amount: 50 },
        ]);

        expect(result).toHaveLength(2);
        expect(result).toEqual(
            expect.arrayContaining([
                { fromUserId: 'a', toUserId: 'c', amount: 30 },
                { fromUserId: 'b', toUserId: 'c', amount: 20 },
            ]),
        );
    });

    it('returns no transactions when everyone is settled', () => {
        const result = simplifyDebts([
            { userId: 'a', amount: 0 },
            { userId: 'b', amount: 0 },
        ]);

        expect(result).toEqual([]);
    });

    it('returns no transactions for an empty group', () => {
        expect(simplifyDebts([])).toEqual([]);
    });
});
