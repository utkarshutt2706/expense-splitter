import { useQuery } from '@tanstack/react-query';

import { getByGroupId } from '@features/balances/api/balancesApi';

export function useGroupBalances(groupId: string) {
    return useQuery({
        queryKey: ['balances', groupId],
        queryFn: () => getByGroupId(groupId),
        enabled: groupId !== '',
    });
}
