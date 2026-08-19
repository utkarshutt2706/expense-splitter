import { useQuery } from '@tanstack/react-query';

import { getByGroupId } from '@features/expenses/api/expensesApi';

export function useExpenses(groupId: string) {
    return useQuery({
        queryKey: ['expenses', groupId],
        queryFn: async () => {
            const expenses = await getByGroupId(groupId);
            return [...expenses].sort(
                (a, b) =>
                    new Date(b.paidOn ?? b.createdAt).getTime() -
                    new Date(a.paidOn ?? a.createdAt).getTime(),
            );
        },
    });
}
