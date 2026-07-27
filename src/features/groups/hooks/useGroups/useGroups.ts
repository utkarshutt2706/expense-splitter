import { useQuery } from '@tanstack/react-query';

import { groupService } from '@services/instances';

export function useGroups() {
    return useQuery({
        queryKey: ['groups'],
        queryFn: () => groupService.getAll(),
    });
}
