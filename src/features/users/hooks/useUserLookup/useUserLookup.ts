import { useQuery } from '@tanstack/react-query';

import { lookup, type LookupQuery } from '@features/users/api/usersApi';

export function useUserLookup(query: LookupQuery | null) {
    return useQuery({
        queryKey: ['users', 'lookup', query],
        queryFn: () => lookup(query as LookupQuery),
        enabled: query !== null && Boolean(query?.query.trim()),
        retry: false,
    });
}
