import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useCurrentUser } from '@app/hooks';
import { create, type CreateGroupInput } from '@features/groups/api/groupsApi';

export function useCreateGroup() {
    const queryClient = useQueryClient();
    const { data: currentUser } = useCurrentUser();

    return useMutation({
        mutationFn: ({ name, memberIds }: CreateGroupInput) =>
            create({ name, memberIds: [currentUser?.id ?? '', ...memberIds] }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['groups'] });
        },
    });
}
