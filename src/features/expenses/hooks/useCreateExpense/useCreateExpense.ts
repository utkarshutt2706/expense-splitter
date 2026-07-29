import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { SplitType } from '@data/entities';
import type {
    ExactSplitEntry,
    PercentageSplitEntry,
    SharesSplitEntry,
} from '@features/expenses/utils/splitCalculator';
import {
    calculateEqualSplit,
    calculateExactSplit,
    calculatePercentageSplit,
    calculateSharesSplit,
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
    sharesSplits?: SharesSplitEntry[];
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
            sharesSplits,
        }: CreateExpenseInput) => {
            let splits;
            if (splitType === 'exact' && exactSplits) {
                splits = calculateExactSplit({ amount, splits: exactSplits });
            } else if (splitType === 'percentage' && percentageSplits) {
                splits = calculatePercentageSplit({ amount, splits: percentageSplits });
            } else if (splitType === 'shares' && sharesSplits) {
                splits = calculateSharesSplit({ amount, splits: sharesSplits });
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
