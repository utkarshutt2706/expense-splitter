import { describe, expect, it } from 'vitest';

import type { SettlementTransaction } from '@features/balances/api/balancesApi';
import type { User } from '@features/users/api/usersApi';

import { groupBalanceViewModel } from './groupBalanceViewModel';

const members: User[] = [
    { id: 'current', name: 'Morgan Reed' },
    { id: 'alex', name: 'Alex Smith' },
    { id: 'alex-j', name: 'Alex Jones' },
    { id: 'zoe', name: 'Zoe Chen' },
];

describe('groupBalanceViewModel', () => {
    it('orders personal payments before receipts and sorts each by descending amount', () => {
        const transactions: SettlementTransaction[] = [
            { fromUserId: 'alex', toUserId: 'current', amount: 4 },
            { fromUserId: 'current', toUserId: 'zoe', amount: 3 },
            { fromUserId: 'alex-j', toUserId: 'current', amount: 8 },
            { fromUserId: 'current', toUserId: 'alex', amount: 7 },
        ];

        const result = groupBalanceViewModel(
            members,
            new Map([['current', -2]]),
            transactions,
            'current',
        );

        expect(result.personal).toEqual([
            { fromUserId: 'current', toUserId: 'alex', amount: 7 },
            { fromUserId: 'current', toUserId: 'zoe', amount: 3 },
            { fromUserId: 'alex-j', toUserId: 'current', amount: 8 },
            { fromUserId: 'alex', toUserId: 'current', amount: 4 },
        ]);
        expect(result.toPay).toBe(10);
        expect(result.toReceive).toBe(12);
        expect(result.net).toBe(-2);
    });

    it('sorts other transactions by payer and then recipient display name', () => {
        const transactions: SettlementTransaction[] = [
            { fromUserId: 'zoe', toUserId: 'alex', amount: 1 },
            { fromUserId: 'alex-j', toUserId: 'zoe', amount: 2 },
            { fromUserId: 'alex-j', toUserId: 'alex', amount: 3 },
        ];

        expect(groupBalanceViewModel(members, new Map(), transactions, 'current').others).toEqual([
            { fromUserId: 'alex-j', toUserId: 'alex', amount: 3 },
            { fromUserId: 'alex-j', toUserId: 'zoe', amount: 2 },
            { fromUserId: 'zoe', toUserId: 'alex', amount: 1 },
        ]);
    });

    it('provides disambiguated names, the current-user label, and an unknown fallback', () => {
        const { nameFor } = groupBalanceViewModel(members, new Map(), [], 'current');

        expect(nameFor('current')).toBe('You');
        expect(nameFor('alex')).toBe('Alex S');
        expect(nameFor('alex-j')).toBe('Alex J');
        expect(nameFor('missing')).toBe('Unknown member');
    });

    it('returns alphabetized settled members while excluding the current user and absent balances', () => {
        const balances = new Map([
            ['current', 0],
            ['alex', 0],
            ['alex-j', 5],
            ['zoe', 0],
        ]);

        expect(groupBalanceViewModel(members, balances, [], 'current').settled).toEqual([
            members[1],
            members[3],
        ]);
    });

    it('recognizes a settled group and derives net from settlements when no balance exists', () => {
        expect(groupBalanceViewModel(members, new Map([['alex', 0]]), [], 'current')).toMatchObject(
            {
                everyoneSettled: true,
                net: 0,
                toPay: 0,
                toReceive: 0,
            },
        );

        const transactions: SettlementTransaction[] = [
            { fromUserId: 'current', toUserId: 'alex', amount: 3 },
            { fromUserId: 'zoe', toUserId: 'current', amount: 8 },
        ];
        expect(groupBalanceViewModel(members, new Map(), transactions, 'current')).toMatchObject({
            everyoneSettled: false,
            net: 5,
            toPay: 3,
            toReceive: 8,
        });
    });

    it('returns no personal transactions when the current user is omitted', () => {
        const transactions: SettlementTransaction[] = [
            { fromUserId: 'alex', toUserId: 'zoe', amount: 3 },
        ];

        expect(groupBalanceViewModel(members, new Map(), transactions)).toMatchObject({
            net: 0,
            personal: [],
            others: transactions,
        });
    });
});
