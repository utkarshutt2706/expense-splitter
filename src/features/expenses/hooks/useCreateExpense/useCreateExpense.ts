import { useMutation, useQueryClient } from '@tanstack/react-query';

import { CURRENT_USER_ID } from '@data/seed';
import { calculateEqualSplit } from '@features/expenses';
import { expenseService } from '@services/instances';

interface CreateExpenseInput {
    groupId: string;
    description: string;
    amount: number;
    participantUserIds: string[];
}

export function useCreateExpense() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ groupId, description, amount, participantUserIds }: CreateExpenseInput) =>
            expenseService.create({
                id: crypto.randomUUID(),
                groupId,
                description,
                amount,
                paidByUserId: CURRENT_USER_ID,
                splitType: 'equal',
                splits: calculateEqualSplit({ amount, participantUserIds }),
                createdAt: new Date().toISOString(),
            }),
        onSuccess: (_, { groupId }) => {
            queryClient.invalidateQueries({ queryKey: ['expenses', groupId] });
        },
    });
}
