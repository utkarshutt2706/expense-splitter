import { useMutation, useQueryClient } from '@tanstack/react-query';

import { create } from '@features/payments/api/paymentsApi';
import { invalidateGroupFinancialData } from '@lib/query/invalidateGroupFinancialData';

interface CreatePaymentInput {
    groupId: string;
    fromUserId: string;
    toUserId: string;
    amount: number;
    paidOn?: string;
}

export function useCreatePayment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ groupId, fromUserId, toUserId, amount, paidOn }: CreatePaymentInput) =>
            create(groupId, { fromUserId, toUserId, amount, paidOn }),
        onSuccess: (_, { groupId }) => {
            invalidateGroupFinancialData(queryClient, groupId);
        },
    });
}
