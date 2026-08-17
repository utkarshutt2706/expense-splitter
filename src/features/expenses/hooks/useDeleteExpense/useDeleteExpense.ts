import { useMutation, useQueryClient } from '@tanstack/react-query';

import { remove } from '@features/expenses/api/expensesApi';

interface DeleteExpenseInput {
    id: string;
    groupId: string;
}

export function useDeleteExpense() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, groupId }: DeleteExpenseInput) => remove(groupId, id),
        onSuccess: (_, { id, groupId }) => {
            queryClient.invalidateQueries({ queryKey: ['expenses', groupId] });
            queryClient.invalidateQueries({ queryKey: ['expenses', 'detail', id] });
            queryClient.invalidateQueries({ queryKey: ['balances', groupId] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            queryClient.invalidateQueries({ queryKey: ['groups'] });
            queryClient.invalidateQueries({ queryKey: ['users', 'friends'] });
        },
    });
}
