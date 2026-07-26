import { useMutation, useQueryClient } from '@tanstack/react-query';
import { groupService, userService } from '../../lib/services';

export class FriendInGroupError extends Error {
    constructor() {
        super('This friend is part of a group and cannot be removed');
        this.name = 'FriendInGroupError';
    }
}

export function useRemoveFriend() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (friendId: string) => {
            const groups = await groupService.getAll();
            const isInGroup = groups.some((group) => group.memberIds.includes(friendId));
            if (isInGroup) {
                throw new FriendInGroupError();
            }
            await userService.delete(friendId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users', 'friends'] });
        },
    });
}
