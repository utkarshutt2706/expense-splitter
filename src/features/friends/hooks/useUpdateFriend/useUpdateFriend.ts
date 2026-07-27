import { useMutation, useQueryClient } from '@tanstack/react-query';

import { DuplicateFriendError, findDuplicateFriend } from '@features/friends';
import { userService } from '@services/instances';

interface UpdateFriendInput {
    id: string;
    name: string;
    email?: string;
    phone?: string;
}

export function useUpdateFriend() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...changes }: UpdateFriendInput) => {
            const friends = await userService.getAll();
            if (findDuplicateFriend(friends, changes, id)) {
                throw new DuplicateFriendError();
            }
            return userService.update(id, changes);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users', 'friends'] });
        },
    });
}
