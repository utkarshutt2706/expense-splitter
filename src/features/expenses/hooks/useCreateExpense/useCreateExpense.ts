import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { SplitType } from '@data/entities';
import { create } from '@features/expenses/api/expensesApi';
import { resolveSplits } from '@features/expenses/utils/resolveSplits';
import type {
    ExactSplitEntry,
    PercentageSplitEntry,
    SharesSplitEntry,
} from '@features/expenses/utils/splitCalculator';
import { invalidateGroupFinancialData } from '@lib/query/invalidateGroupFinancialData';

interface CreateExpenseInput {
    groupId: string;
    description: string;
    amount: number;
    paidByUserId: string;
    paidOn?: string;
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
            paidOn,
            participantUserIds,
            splitType,
            exactSplits,
            percentageSplits,
            sharesSplits,
        }: CreateExpenseInput) => {
            const splits = resolveSplits({
                splitType,
                amount,
                participantUserIds,
                exactSplits,
                percentageSplits,
                sharesSplits,
            });

            return create(groupId, {
                description,
                amount,
                paidByUserId,
                paidOn,
                splitType,
                splits,
                ...(splitType === 'percentage' && { percentages: percentageSplits }),
                ...(splitType === 'shares' && { shares: sharesSplits }),
            });
        },
        onSuccess: (_, { groupId }) => {
            invalidateGroupFinancialData(queryClient, groupId);
        },
    });
}
