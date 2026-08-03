import { useQuery } from '@tanstack/react-query';

import type { User } from '@data/entities';
import { getAll } from '@features/friends/api/friendsApi';

export function useGroupMembers(memberIds: string[]) {
    return useQuery({
        queryKey: ['users', 'groupMembers', memberIds],
        queryFn: async () => {
            const users = await getAll();
            const byId = new Map(users.map((user) => [user.id, user]));
            return memberIds.reduce<User[]>((members, id) => {
                const user = byId.get(id);
                if (user) members.push(user);
                return members;
            }, []);
        },
    });
}
