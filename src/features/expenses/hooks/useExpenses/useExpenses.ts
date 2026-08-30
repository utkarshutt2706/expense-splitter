import { useQuery } from '@tanstack/react-query';

import { getByGroupId } from '@features/expenses/api/expensesApi';
import { compareFinancialActivityNewestFirst } from '@shared/utils';

export function useExpenses(groupId: string) {
    return useQuery({
        queryKey: ['expenses', groupId],
        queryFn: async () => {
            const expenses = await getByGroupId(groupId);
            return [...expenses].sort(compareFinancialActivityNewestFirst);
        },
    });
}
