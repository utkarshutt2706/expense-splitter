import { useQuery } from '@tanstack/react-query';

import { expenseService } from '@services/instances';

export function useExpenses(groupId: string) {
    return useQuery({
        queryKey: ['expenses', groupId],
        queryFn: async () => {
            const expenses = await expenseService.getByGroupId(groupId);
            return [...expenses].sort(
                (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
            );
        },
    });
}
