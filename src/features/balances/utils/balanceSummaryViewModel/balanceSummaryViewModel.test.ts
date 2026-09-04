import { describe, expect, it } from 'vitest';

import type { GroupBalances } from '@features/balances/api/balancesApi';
import type { User } from '@features/users/api/usersApi';

import { balanceSummaryViewModel } from './balanceSummaryViewModel';

const members = [{ id: 'current' }, { id: 'alex' }, { id: 'sam' }] as User[];

describe('balanceSummaryViewModel', () => {
    it('summarizes the current user balance and their incoming and outgoing settlements', () => {
        const groupBalances: GroupBalances = {
            balances: [
                { userId: 'current', balance: -10 },
                { userId: 'alex', balance: 6 },
                { userId: 'sam', balance: 4 },
            ],
            settlements: [
                { fromUserId: 'current', toUserId: 'alex', amount: 6 },
                { fromUserId: 'current', toUserId: 'sam', amount: 4 },
                { fromUserId: 'alex', toUserId: 'current', amount: 2 },
                { fromUserId: 'alex', toUserId: 'sam', amount: 99 },
            ],
        };

        expect(balanceSummaryViewModel(groupBalances, members, 'current')).toEqual({
            balance: -10,
            hasFinancialActivity: true,
            isGroupFullySettled: false,
            isMixedPosition: true,
            isPersonallySettled: false,
            toPay: 10,
            toReceive: 2,
        });
    });

    it('defaults a missing personal balance to zero', () => {
        const groupBalances: GroupBalances = {
            balances: [{ userId: 'alex', balance: 10 }],
            settlements: [],
        };

        expect(balanceSummaryViewModel(groupBalances, members, 'current')).toMatchObject({
            balance: 0,
            isPersonallySettled: true,
            toPay: 0,
            toReceive: 0,
        });
    });

    it('reports a fully settled group only when every member has a zero balance', () => {
        const settledBalances: GroupBalances = {
            balances: [
                { userId: 'current', balance: 0 },
                { userId: 'alex', balance: 0 },
                { userId: 'sam', balance: 0 },
            ],
            settlements: [],
        };

        expect(balanceSummaryViewModel(settledBalances, members, 'current')).toMatchObject({
            hasFinancialActivity: true,
            isGroupFullySettled: true,
            isPersonallySettled: true,
        });
        expect(
            balanceSummaryViewModel(
                { ...settledBalances, balances: settledBalances.balances.slice(0, 2) },
                members,
                'current',
            ).isGroupFullySettled,
        ).toBe(true);
    });

    it('does not treat empty group data as a fully settled group', () => {
        const emptyBalances: GroupBalances = { balances: [], settlements: [] };

        expect(balanceSummaryViewModel(emptyBalances, members, 'current')).toMatchObject({
            balance: 0,
            hasFinancialActivity: false,
            isGroupFullySettled: false,
            isMixedPosition: false,
            isPersonallySettled: true,
            toPay: 0,
            toReceive: 0,
        });
        expect(balanceSummaryViewModel(emptyBalances, [], 'current').isGroupFullySettled).toBe(
            false,
        );
    });

    it('counts settlement-only data as financial activity', () => {
        const groupBalances: GroupBalances = {
            balances: [],
            settlements: [{ fromUserId: 'current', toUserId: 'alex', amount: 5 }],
        };

        expect(balanceSummaryViewModel(groupBalances, members, 'current')).toMatchObject({
            hasFinancialActivity: true,
            isGroupFullySettled: false,
            isMixedPosition: false,
            toPay: 5,
            toReceive: 0,
        });
    });
});
