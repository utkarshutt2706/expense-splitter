import { useQuery } from '@tanstack/react-query';
import { groupService } from '../../lib/services';

export function useGroup(id: string) {
    return useQuery({
        queryKey: ['groups', id],
        queryFn: () => groupService.getById(id),
    });
}
