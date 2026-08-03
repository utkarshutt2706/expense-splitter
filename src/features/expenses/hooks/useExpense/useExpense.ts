import { useQuery } from '@tanstack/react-query';

import { getById } from '@features/expenses/api/expensesApi';

export function useExpense(groupId: string, id: string) {
    return useQuery({
        queryKey: ['expenses', 'detail', id],
        queryFn: () => getById(groupId, id),
        enabled: groupId !== '' && id !== '',
    });
}
