import { useQuery } from '@tanstack/react-query';

import { paymentService } from '@services/instances';

export function usePayments(groupId: string) {
    return useQuery({
        queryKey: ['payments', groupId],
        queryFn: async () => {
            const payments = await paymentService.getByGroupId(groupId);
            return [...payments].sort(
                (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
            );
        },
    });
}
