import { useQuery } from '@tanstack/react-query';
import { userService } from '../../lib/services';
import { CURRENT_USER_ID } from '../../lib/storage/seed';

export function useFriends() {
    return useQuery({
        queryKey: ['users', 'friends'],
        queryFn: async () => {
            const users = await userService.getAll();
            return users.filter((user) => user.id !== CURRENT_USER_ID);
        },
    });
}
