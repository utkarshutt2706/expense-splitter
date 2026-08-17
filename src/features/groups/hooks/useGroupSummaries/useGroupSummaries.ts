import { useQuery } from '@tanstack/react-query';

import { getAllSummaries } from '@features/groups/api/groupsApi';

export function useGroupSummaries() {
    return useQuery({
        queryKey: ['groups', 'summaries'],
        queryFn: () => getAllSummaries(),
    });
}
