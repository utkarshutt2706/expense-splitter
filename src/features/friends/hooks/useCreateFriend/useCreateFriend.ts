import { useMutation, useQueryClient } from '@tanstack/react-query';

import { create, getAll, type CreateFriendInput } from '@features/friends/api/friendsApi';
import { DuplicateFriendError, findDuplicateFriend } from '@features/friends/utils/duplicateFriend';
import { ApiError } from '@lib/api/apiError';

export function useCreateFriend() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: CreateFriendInput) => {
            const friends = await getAll();
            if (findDuplicateFriend(friends, input)) {
                throw new DuplicateFriendError();
            }
            try {
                return await create(input);
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
