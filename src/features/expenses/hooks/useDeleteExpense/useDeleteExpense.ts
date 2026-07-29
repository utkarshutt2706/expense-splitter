import { useMutation, useQueryClient } from '@tanstack/react-query';

import { expenseService } from '@services/instances';

interface DeleteExpenseInput {
    id: string;
    groupId: string;
}

export function useDeleteExpense() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id }: DeleteExpenseInput) => expenseService.delete(id),
        onSuccess: (_, { groupId }) => {
            queryClient.invalidateQueries({ queryKey: ['expenses', groupId] });
        },
    });
}
