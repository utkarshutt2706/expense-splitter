import { CURRENT_USER_ID } from '@data/seed';
import { groupService } from '@services/instances';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface CreateGroupInput {
    name: string;
    memberIds: string[];
}

export function useCreateGroup() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ name, memberIds }: CreateGroupInput) =>
            groupService.create({
                id: crypto.randomUUID(),
                name,
                memberIds: [CURRENT_USER_ID, ...memberIds],
                createdAt: new Date().toISOString(),
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['groups'] });
        },
    });
}
