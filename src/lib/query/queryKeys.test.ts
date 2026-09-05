import { describe, expect, it } from 'vitest';

import { queryKeys } from './queryKeys';

describe('queryKeys', () => {
    it('defines collection-level query keys', () => {
        expect(queryKeys.dashboard.all).toEqual(['dashboard']);
        expect(queryKeys.groups.all).toEqual(['groups']);
        expect(queryKeys.users.friends).toEqual(['users', 'friends']);
    });

    it('builds group-scoped query keys without losing the group identifier', () => {
        expect(queryKeys.balances.group('group-1')).toEqual(['balances', 'group-1']);
        expect(queryKeys.expenses.group('group-1')).toEqual(['expenses', 'group-1']);
        expect(queryKeys.payments.group('group-1')).toEqual(['payments', 'group-1']);
    });

    it('builds expense-detail keys distinct from group expense keys', () => {
        expect(queryKeys.expenses.detail('expense-1')).toEqual(['expenses', 'detail', 'expense-1']);
        expect(queryKeys.expenses.detail('expense-1')).not.toEqual(
            queryKeys.expenses.group('expense-1'),
        );
    });
});
