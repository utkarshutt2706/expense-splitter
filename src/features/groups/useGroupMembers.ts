import { useQuery } from '@tanstack/react-query';
import { userService } from '../../lib/services';
import type { User } from '../../lib/storage/models';

export function useGroupMembers(memberIds: string[]) {
    return useQuery({
        queryKey: ['users', 'groupMembers', memberIds],
        queryFn: async () => {
            const users = await userService.getAll();
            const byId = new Map(users.map((user) => [user.id, user]));
            return memberIds.reduce<User[]>((members, id) => {
                const user = byId.get(id);
                if (user) members.push(user);
                return members;
            }, []);
        },
    });
}
