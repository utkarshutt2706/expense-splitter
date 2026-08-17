import { useMutation, useQueryClient } from '@tanstack/react-query';

import { update } from '@features/groups/api/groupsApi';

interface UpdateGroupMembersInput {
    id: string;
    memberIds: string[];
}

export function useUpdateGroupMembers() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, memberIds }: UpdateGroupMembersInput) => update(id, { memberIds }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['groups'] });
            queryClient.invalidateQueries({ queryKey: ['users', 'friends'] });
        },
    });
}
