import { useQuery } from '@tanstack/react-query';

import { getByGroupId } from '@features/payments/api/paymentsApi';

export function usePayments(groupId: string) {
    return useQuery({
        queryKey: ['payments', groupId],
        queryFn: async () => {
            const payments = await getByGroupId(groupId);
            return [...payments].sort(
                (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
            );
        },
    });
}
