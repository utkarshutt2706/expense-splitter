import { useMutation, useQueryClient } from '@tanstack/react-query';

import { remove } from '@features/payments/api/paymentsApi';

interface DeletePaymentInput {
    groupId: string;
    id: string;
}

export function useDeletePayment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ groupId, id }: DeletePaymentInput) => remove(groupId, id),
        onSuccess: (_, { groupId }) => {
            queryClient.invalidateQueries({ queryKey: ['payments', groupId] });
            queryClient.invalidateQueries({ queryKey: ['balances', groupId] });
        },
    });
}
