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
    });
});
