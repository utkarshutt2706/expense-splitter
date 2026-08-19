import { useMutation, useQueryClient } from '@tanstack/react-query';

import { update } from '@features/payments/api/paymentsApi';

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
            queryClient.invalidateQueries({ queryKey: ['payments', groupId] });
            queryClient.invalidateQueries({ queryKey: ['balances', groupId] });
            queryClient.invalidateQueries({ queryKey: ['groups'] });
            queryClient.invalidateQueries({ queryKey: ['users', 'friends'] });
        },
    });
}
