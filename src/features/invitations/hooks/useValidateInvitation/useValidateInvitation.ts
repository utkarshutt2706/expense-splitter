import { useQuery } from '@tanstack/react-query';

import { validate } from '@features/invitations/api/invitationsApi';

// Pass null to skip the request entirely (no ?invite=<token> in the URL). A
// 404/409 is an expected "not a valid invite" outcome here, not a transient
// failure, so it's never retried.
export function useValidateInvitation(token: string | null) {
    return useQuery({
        queryKey: ['invitations', token],
        queryFn: () => validate(token as string),
        enabled: token !== null,
        retry: false,
    });
}
