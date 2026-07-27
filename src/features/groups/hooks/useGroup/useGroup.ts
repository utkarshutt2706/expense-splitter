import { useQuery } from '@tanstack/react-query';

import { groupService } from '@services/instances';

export function useGroup(id: string) {
    return useQuery({
        queryKey: ['groups', id],
        queryFn: () => groupService.getById(id),
        enabled: id !== '',
    });
}
