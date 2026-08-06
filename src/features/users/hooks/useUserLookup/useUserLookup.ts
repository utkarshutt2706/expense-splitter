import { useQuery } from '@tanstack/react-query';

import { lookup, type LookupQuery } from '@features/users/api/usersApi';

// Pass null to skip the request entirely (e.g. the search text isn't a
// complete email/phone yet). A 404 is an expected "no match" outcome here,
// not a transient failure, so it's never retried.
export function useUserLookup(query: LookupQuery | null) {
    return useQuery({
        queryKey: ['users', 'lookup', query],
        queryFn: () => lookup(query as LookupQuery),
        enabled: query !== null,
        retry: false,
    });
}
