import { useMutation, useQueryClient } from '@tanstack/react-query';

import { create } from '@features/payments/api/paymentsApi';

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
            queryClient.invalidateQueries({ queryKey: ['payments', groupId] });
            queryClient.invalidateQueries({ queryKey: ['balances', groupId] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            queryClient.invalidateQueries({ queryKey: ['groups'] });
            queryClient.invalidateQueries({ queryKey: ['users', 'friends'] });
        },
    });
}
