import { useMutation, useQueryClient } from '@tanstack/react-query';

import { groupService } from '@services/instances';

interface UpdateGroupMembersInput {
    id: string;
    memberIds: string[];
}

export function useUpdateGroupMembers() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, memberIds }: UpdateGroupMembersInput) =>
            groupService.update(id, { memberIds }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['groups'] });
        },
    });
}
