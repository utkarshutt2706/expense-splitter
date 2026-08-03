import { useQuery } from '@tanstack/react-query';

import { useCurrentUser } from '@app/hooks';
import { getFriends } from '@features/friends/api/friendsApi';

export function useFriends() {
    const { data: currentUser } = useCurrentUser();

    return useQuery({
        queryKey: ['users', 'friends', currentUser?.id],
        queryFn: () => getFriends(),
    });
}
