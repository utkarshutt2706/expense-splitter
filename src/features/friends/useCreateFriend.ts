import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../../lib/services';
import { DuplicateFriendError, findDuplicateFriend } from './duplicateFriend';

interface CreateFriendInput {
    name: string;
    email?: string;
    phone?: string;
}

export function useCreateFriend() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: CreateFriendInput) => {
            const friends = await userService.getAll();
            if (findDuplicateFriend(friends, input)) {
                throw new DuplicateFriendError();
            }
            return userService.create({ id: crypto.randomUUID(), ...input });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users', 'friends'] });
        },
    });
}
