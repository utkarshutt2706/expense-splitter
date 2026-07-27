import { useQuery } from '@tanstack/react-query';

import { CURRENT_USER_ID } from '@data/seed';
import { userService } from '@services/instances';

export function useFriends() {
    return useQuery({
        queryKey: ['users', 'friends'],
        queryFn: async () => {
            const users = await userService.getAll();
            return users.filter((user) => user.id !== CURRENT_USER_ID);
        },
    });
}
