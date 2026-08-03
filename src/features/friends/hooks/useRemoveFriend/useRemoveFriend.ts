import { useMutation, useQueryClient } from '@tanstack/react-query';

import { remove } from '@features/friends/api/friendsApi';
import { ApiError } from '@lib/api/apiError';

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
            try {
                await remove(friendId);
            } catch (error) {
                if (error instanceof ApiError && error.code === 'CONFLICT') {
                    throw new FriendInGroupError();
                }
                throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users', 'friends'] });
        },
    });
}
