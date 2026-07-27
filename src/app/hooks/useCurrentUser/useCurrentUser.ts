import { useQuery } from '@tanstack/react-query';

import { CURRENT_USER_ID } from '@data/seed';
import { userService } from '@services/instances';

export function useCurrentUser() {
    return useQuery({
        queryKey: ['users', CURRENT_USER_ID],
        queryFn: () => userService.getById(CURRENT_USER_ID),
    });
}
