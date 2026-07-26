import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../../lib/services';

interface UpdateFriendInput {
    id: string;
    name: string;
    email: string;
}

export function useUpdateFriend() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, ...changes }: UpdateFriendInput) => userService.update(id, changes),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users', 'friends'] });
        },
    });
}
