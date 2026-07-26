import { useMutation, useQueryClient } from '@tanstack/react-query';
import { groupService } from '../../lib/services';
import { CURRENT_USER_ID } from '../../lib/storage/seed';

interface UpdateGroupInput {
    id: string;
    name: string;
    memberIds: string[];
}

export function useUpdateGroup() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, name, memberIds }: UpdateGroupInput) =>
            groupService.update(id, { name, memberIds: [CURRENT_USER_ID, ...memberIds] }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['groups'] });
        },
    });
}
