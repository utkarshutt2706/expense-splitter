import { useQuery } from '@tanstack/react-query';
import { userService } from '../lib/services';
import { CURRENT_USER_ID } from '../lib/storage/seed';

export function useCurrentUser() {
    return useQuery({
        queryKey: ['users', CURRENT_USER_ID],
        queryFn: () => userService.getById(CURRENT_USER_ID),
    });
}
