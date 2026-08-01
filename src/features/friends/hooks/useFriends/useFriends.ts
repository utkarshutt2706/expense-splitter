import { useQuery } from '@tanstack/react-query';

import { useCurrentUser } from '@app/hooks';
import { userService } from '@services/instances';

export function useFriends() {
    const { data: currentUser } = useCurrentUser();

    return useQuery({
        queryKey: ['users', 'friends', currentUser?.id],
        queryFn: async () => {
            const users = await userService.getAll();
            return users.filter((user) => user.id !== currentUser?.id);
        },
    });
}
