import { useQuery } from '@tanstack/react-query';

import { getAll } from '@features/groups/api/groupsApi';

export function useGroups() {
    return useQuery({
        queryKey: ['groups'],
        queryFn: () => getAll(),
    });
}
