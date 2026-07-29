import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { SplitType } from '@data/entities';
import type {
    ExactSplitEntry,
    PercentageSplitEntry,
} from '@features/expenses/utils/splitCalculator';
import {
    calculateEqualSplit,
    calculateExactSplit,
    calculatePercentageSplit,
} from '@features/expenses/utils/splitCalculator';
import { expenseService } from '@services/instances';

interface CreateExpenseInput {
    groupId: string;
    description: string;
    amount: number;
    paidByUserId: string;
    participantUserIds: string[];
    splitType: SplitType;
    exactSplits?: ExactSplitEntry[];
    percentageSplits?: PercentageSplitEntry[];
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
            percentageSplits,
        }: CreateExpenseInput) => {
            let splits;
            if (splitType === 'exact' && exactSplits) {
                splits = calculateExactSplit({ amount, splits: exactSplits });
            } else if (splitType === 'percentage' && percentageSplits) {
                splits = calculatePercentageSplit({ amount, splits: percentageSplits });
            } else {
                splits = calculateEqualSplit({ amount, participantUserIds });
            }

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
