import { useQuery } from '@tanstack/react-query';

import { getByGroupId } from '@features/payments/api/paymentsApi';
import { compareFinancialActivityNewestFirst } from '@shared/utils';

export function usePayments(groupId: string) {
    return useQuery({
        queryKey: ['payments', groupId],
        queryFn: async () => {
            const payments = await getByGroupId(groupId);
            return [...payments].sort(compareFinancialActivityNewestFirst);
        },
    });
}
