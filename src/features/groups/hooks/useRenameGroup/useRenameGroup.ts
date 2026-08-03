import { useMutation, useQueryClient } from '@tanstack/react-query';

import { update } from '@features/groups/api/groupsApi';

interface RenameGroupInput {
    id: string;
    name: string;
}

export function useRenameGroup() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, name }: RenameGroupInput) => update(id, { name }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['groups'] });
        },
    });
}
