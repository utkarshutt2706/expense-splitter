import { useQuery } from '@tanstack/react-query';

import { lookup, type LookupQuery } from '@features/users/api/usersApi';

const MIN_USER_LOOKUP_LENGTH = 3;

export function useUserLookup(query: LookupQuery | null) {
    return useQuery({
        queryKey: ['users', 'lookup', query],
        queryFn: () => lookup(query as LookupQuery),
        enabled: query !== null && query.query.trim().length >= MIN_USER_LOOKUP_LENGTH,
        retry: false,
    });
}
