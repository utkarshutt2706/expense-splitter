import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { SplitType } from '@data/entities';
import { resolveSplits } from '@features/expenses/utils/resolveSplits';
import type {
    ExactSplitEntry,
    PercentageSplitEntry,
    SharesSplitEntry,
} from '@features/expenses/utils/splitCalculator';
import { expenseService } from '@services/instances';

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

            return expenseService.update(id, {
                description,
                amount,
                paidByUserId,
                splitType,
                splits,
            });
        },
        onSuccess: (_, { id, groupId }) => {
            queryClient.invalidateQueries({ queryKey: ['expenses', groupId] });
            queryClient.invalidateQueries({ queryKey: ['expenses', 'detail', id] });
        },
    });
}
