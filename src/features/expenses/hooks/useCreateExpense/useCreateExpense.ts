import { useMutation, useQueryClient } from '@tanstack/react-query';

import { calculateEqualSplit } from '@features/expenses/utils/splitCalculator';
import { expenseService } from '@services/instances';

interface CreateExpenseInput {
    groupId: string;
    description: string;
    amount: number;
    paidByUserId: string;
    participantUserIds: string[];
}

export function useCreateExpense() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            groupId,
            description,
            amount,
            paidByUserId,
            participantUserIds,
        }: CreateExpenseInput) =>
            expenseService.create({
                id: crypto.randomUUID(),
                groupId,
                description,
                amount,
                paidByUserId,
                splitType: 'equal',
                splits: calculateEqualSplit({ amount, participantUserIds }),
                createdAt: new Date().toISOString(),
            }),
        onSuccess: (_, { groupId }) => {
            queryClient.invalidateQueries({ queryKey: ['expenses', groupId] });
        },
    });
}
