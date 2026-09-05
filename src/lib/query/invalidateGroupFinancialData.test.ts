import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';

import { invalidateGroupFinancialData } from './invalidateGroupFinancialData';
import { queryKeys } from './queryKeys';

describe('invalidateGroupFinancialData', () => {
    it('invalidates every query affected by a group financial mutation', () => {
        const queryClient = new QueryClient();
        const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

        invalidateGroupFinancialData(queryClient, 'group-1');

        expect(invalidate.mock.calls.map(([filters]) => filters?.queryKey)).toEqual([
            queryKeys.expenses.group('group-1'),
            queryKeys.payments.group('group-1'),
            queryKeys.balances.group('group-1'),
            queryKeys.dashboard.all,
            queryKeys.groups.all,
            queryKeys.users.friends,
        ]);
        expect(invalidate).toHaveBeenCalledTimes(6);
    });

    it('invalidates cached data for the requested group without targeting another group key', () => {
        const queryClient = new QueryClient();
        queryClient.setQueryData(queryKeys.expenses.group('group-1'), ['expense-1']);
        queryClient.setQueryData(queryKeys.expenses.group('group-2'), ['expense-2']);

        invalidateGroupFinancialData(queryClient, 'group-1');

        expect(queryClient.getQueryState(queryKeys.expenses.group('group-1'))?.isInvalidated).toBe(
            true,
        );
        expect(queryClient.getQueryState(queryKeys.expenses.group('group-2'))?.isInvalidated).toBe(
            false,
        );
    });
});
