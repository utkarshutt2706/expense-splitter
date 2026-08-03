import { useQuery } from '@tanstack/react-query';

import { getById } from '@features/groups/api/groupsApi';

export function useGroup(id: string) {
    return useQuery({
        queryKey: ['groups', id],
        queryFn: () => getById(id),
        enabled: id !== '',
    });
}
