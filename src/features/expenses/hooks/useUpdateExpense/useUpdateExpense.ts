import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { SplitType } from '@data/entities';
import { update } from '@features/expenses/api/expensesApi';
import { resolveSplits } from '@features/expenses/utils/resolveSplits';
import type {
    ExactSplitEntry,
    PercentageSplitEntry,
    SharesSplitEntry,
} from '@features/expenses/utils/splitCalculator';

interface UpdateExpenseInput {
    id: string;
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

export function useUpdateExpense() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            id,
            groupId,
            description,
            amount,
            paidByUserId,
            participantUserIds,
            splitType,
            exactSplits,
            percentageSplits,
            sharesSplits,
        }: UpdateExpenseInput) => {
            const splits = resolveSplits({
                splitType,
                amount,
                participantUserIds,
                exactSplits,
                percentageSplits,
                sharesSplits,
            });

            return update(groupId, id, {
                description,
                amount,
                paidByUserId,
                splitType,
                splits,
                ...(splitType === 'percentage' && { percentages: percentageSplits }),
                ...(splitType === 'shares' && { shares: sharesSplits }),
            });
        },
        onSuccess: (_, { id, groupId }) => {
            queryClient.invalidateQueries({ queryKey: ['expenses', groupId] });
            queryClient.invalidateQueries({ queryKey: ['expenses', 'detail', id] });
        },
    });
}
