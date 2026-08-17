import { useMutation, useQueryClient } from '@tanstack/react-query';

import { update } from '@features/payments/api/paymentsApi';

interface UpdatePaymentInput {
    groupId: string;
    id: string;
    fromUserId: string;
    toUserId: string;
    amount: number;
}

export function useUpdatePayment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ groupId, id, fromUserId, toUserId, amount }: UpdatePaymentInput) =>
            update(groupId, id, { fromUserId, toUserId, amount }),
        onSuccess: (_, { groupId }) => {
            queryClient.invalidateQueries({ queryKey: ['payments', groupId] });
            queryClient.invalidateQueries({ queryKey: ['balances', groupId] });
            queryClient.invalidateQueries({ queryKey: ['groups'] });
            queryClient.invalidateQueries({ queryKey: ['users', 'friends'] });
        },
    });
}
