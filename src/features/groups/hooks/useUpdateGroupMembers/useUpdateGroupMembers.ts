import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { Group } from '@data/entities';
import { update } from '@features/groups/api/groupsApi';
import { create as createInvitation } from '@features/invitations/api/invitationsApi';

interface UpdateGroupMembersInput {
    id: string;
    memberIds: string[];
    inviteEmails: string[];
}

export interface UpdateGroupMembersResult {
    group: Group;
    failedInviteEmails: string[];
}

export function useUpdateGroupMembers() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            id,
            memberIds,
            inviteEmails,
        }: UpdateGroupMembersInput): Promise<UpdateGroupMembersResult> => {
            const group = await update(id, { memberIds });

            // One request per email, so a single failure doesn't undo the
            // membership change or block the other invites from going out.
            const results = await Promise.allSettled(
                inviteEmails.map((email) => createInvitation(id, email)),
            );
            const failedInviteEmails = inviteEmails.filter(
                (_, index) => results[index]?.status === 'rejected',
            );

            return { group, failedInviteEmails };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['groups'] });
        },
    });
}
