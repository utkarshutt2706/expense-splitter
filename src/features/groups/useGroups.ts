import { useQuery } from '@tanstack/react-query';
import { groupService } from '../../lib/services';

export function useGroups() {
    return useQuery({
        queryKey: ['groups'],
        queryFn: () => groupService.getAll(),
    });
}
