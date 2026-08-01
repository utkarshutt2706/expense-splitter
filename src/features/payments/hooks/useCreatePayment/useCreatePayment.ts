import { useMutation, useQueryClient } from '@tanstack/react-query';

import { paymentService } from '@services/instances';

interface CreatePaymentInput {
    groupId: string;
    fromUserId: string;
    toUserId: string;
    amount: number;
}

export function useCreatePayment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ groupId, fromUserId, toUserId, amount }: CreatePaymentInput) =>
            paymentService.create({
                id: crypto.randomUUID(),
                groupId,
                fromUserId,
                toUserId,
                amount,
                createdAt: new Date().toISOString(),
            }),
        onSuccess: (_, { groupId }) => {
            queryClient.invalidateQueries({ queryKey: ['payments', groupId] });
        },
    });
}
