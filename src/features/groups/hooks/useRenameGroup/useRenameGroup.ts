import { useMutation, useQueryClient } from '@tanstack/react-query';

import { groupService } from '@services/instances';

interface RenameGroupInput {
    id: string;
    name: string;
}

export function useRenameGroup() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, name }: RenameGroupInput) => groupService.update(id, { name }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['groups'] });
        },
    });
}
