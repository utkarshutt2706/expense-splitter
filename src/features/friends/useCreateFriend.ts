import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../../lib/services';

interface CreateFriendInput {
    name: string;
    email: string;
}

export function useCreateFriend() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (input: CreateFriendInput) =>
            userService.create({ id: crypto.randomUUID(), ...input }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users', 'friends'] });
        },
    });
}
