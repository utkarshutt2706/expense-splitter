import { useCurrentUser } from '@app/hooks';
import { groupService } from '@services/instances';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface CreateGroupInput {
    name: string;
    memberIds: string[];
}

export function useCreateGroup() {
    const queryClient = useQueryClient();
    const { data: currentUser } = useCurrentUser();

    return useMutation({
        mutationFn: ({ name, memberIds }: CreateGroupInput) =>
            groupService.create({
                id: crypto.randomUUID(),
                name,
                memberIds: [currentUser?.id ?? '', ...memberIds],
                createdAt: new Date().toISOString(),
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['groups'] });
        },
    });
}
