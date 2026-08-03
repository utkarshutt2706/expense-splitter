import { useMutation, useQueryClient } from '@tanstack/react-query';

import { getAll, update } from '@features/friends/api/friendsApi';
import { DuplicateFriendError, findDuplicateFriend } from '@features/friends/utils/duplicateFriend';
import { ApiError } from '@lib/api/apiError';

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
            const friends = await getAll();
            if (findDuplicateFriend(friends, changes, id)) {
                throw new DuplicateFriendError();
            }
            try {
                return await update(id, changes);
            } catch (error) {
                if (error instanceof ApiError && error.code === 'CONFLICT') {
                    throw new DuplicateFriendError();
                }
                throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users', 'friends'] });
        },
    });
}
