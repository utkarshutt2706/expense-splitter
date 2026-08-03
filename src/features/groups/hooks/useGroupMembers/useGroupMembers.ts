import { useQuery } from '@tanstack/react-query';

import type { User } from '@data/entities';
import { getByIds } from '@features/users/api/usersApi';

export function useGroupMembers(memberIds: string[]) {
    return useQuery({
        queryKey: ['users', 'groupMembers', memberIds],
        queryFn: async () => {
            if (memberIds.length === 0) return [];

            const users = await getByIds(memberIds);
            const byId = new Map(users.map((user) => [user.id, user]));
            return memberIds.reduce<User[]>((members, id) => {
                const user = byId.get(id);
                if (user) members.push(user);
                return members;
            }, []);
        },
    });
}
