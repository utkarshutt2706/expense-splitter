import { useQuery } from '@tanstack/react-query';

import { useCurrentUser } from '@app/hooks';
import { getAll } from '@features/friends/api/friendsApi';

export function useFriends() {
    const { data: currentUser } = useCurrentUser();

    return useQuery({
        queryKey: ['users', 'friends', currentUser?.id],
        queryFn: async () => {
            const users = await getAll();
            return users.filter((user) => user.id !== currentUser?.id);
        },
    });
}
