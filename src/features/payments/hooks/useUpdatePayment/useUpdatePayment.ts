import { useMutation, useQueryClient } from '@tanstack/react-query';

import { update } from '@features/payments/api/paymentsApi';
import { invalidateGroupFinancialData } from '@lib/query/invalidateGroupFinancialData';

interface UpdatePaymentInput {
    groupId: string;
    id: string;
    fromUserId: string;
    toUserId: string;
    amount: number;
    paidOn?: string;
}

export function useUpdatePayment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ groupId, id, fromUserId, toUserId, amount, paidOn }: UpdatePaymentInput) =>
            update(groupId, id, { fromUserId, toUserId, amount, paidOn }),
        onSuccess: (_, { groupId }) => {
            invalidateGroupFinancialData(queryClient, groupId);
        },
    });
}
