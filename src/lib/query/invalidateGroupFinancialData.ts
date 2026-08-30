import type { QueryClient } from '@tanstack/react-query';

import { queryKeys } from './queryKeys';

export function invalidateGroupFinancialData(queryClient: QueryClient, groupId: string): void {
    queryClient.invalidateQueries({ queryKey: queryKeys.expenses.group(groupId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.payments.group(groupId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.balances.group(groupId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.groups.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.users.friends });
}
