import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useCurrentUser } from '@app/hooks';
import { create, type CreateGroupInput } from '@features/groups/api/groupsApi';

export function useCreateGroup() {
    const queryClient = useQueryClient();
    const { data: currentUser } = useCurrentUser();

    return useMutation({
        mutationFn: ({ name, memberIds }: CreateGroupInput) => {
            if (!currentUser) throw new Error('You must be signed in to create a group');
            return create({ name, memberIds: [currentUser.id, ...memberIds] });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['groups'] });
            queryClient.invalidateQueries({ queryKey: ['users', 'friends'] });
        },
    });
}
