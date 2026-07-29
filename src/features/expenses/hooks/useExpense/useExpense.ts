import { useQuery } from '@tanstack/react-query';

import { expenseService } from '@services/instances';

export function useExpense(id: string) {
    return useQuery({
        queryKey: ['expenses', 'detail', id],
        queryFn: () => expenseService.getById(id),
        enabled: id !== '',
    });
}
