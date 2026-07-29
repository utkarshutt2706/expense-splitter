import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { SplitType } from '@data/entities';
import type { ExactSplitEntry } from '@features/expenses/utils/splitCalculator';
import { calculateEqualSplit, calculateExactSplit } from '@features/expenses/utils/splitCalculator';
import { expenseService } from '@services/instances';

interface CreateExpenseInput {
    groupId: string;
    description: string;
    amount: number;
    paidByUserId: string;
    participantUserIds: string[];
    splitType: SplitType;
    exactSplits?: ExactSplitEntry[];
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
            splitType,
            exactSplits,
        }: CreateExpenseInput) => {
            const splits =
                splitType === 'exact' && exactSplits
                    ? calculateExactSplit({ amount, splits: exactSplits })
                    : calculateEqualSplit({ amount, participantUserIds });

            return expenseService.create({
                id: crypto.randomUUID(),
                groupId,
                description,
                amount,
                paidByUserId,
                splitType,
                splits,
                createdAt: new Date().toISOString(),
            });
        },
        onSuccess: (_, { groupId }) => {
            queryClient.invalidateQueries({ queryKey: ['expenses', groupId] });
        },
    });
}
