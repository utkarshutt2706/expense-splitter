import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useCurrentUser } from '@app/hooks';
import type { Group } from '@data/entities';
import { create as createGroup, type CreateGroupInput } from '@features/groups/api/groupsApi';
import { create as createInvitation } from '@features/invitations/api/invitationsApi';

export interface CreateGroupWithInvitesInput extends CreateGroupInput {
    inviteEmails: string[];
}

export interface CreateGroupResult {
    group: Group;
    failedInviteEmails: string[];
}

export function useCreateGroup() {
    const queryClient = useQueryClient();
    const { data: currentUser } = useCurrentUser();

    return useMutation({
        mutationFn: async ({
            name,
            memberIds,
            inviteEmails,
        }: CreateGroupWithInvitesInput): Promise<CreateGroupResult> => {
            const group = await createGroup({
                name,
                memberIds: [currentUser?.id ?? '', ...memberIds],
            });

            // The group has to exist before it can be invited into -- fired after
            // creation, one request per email, so a single failure doesn't undo
            // the group or block the other invites from going out.
            const results = await Promise.allSettled(
                inviteEmails.map((email) => createInvitation(group.id, email)),
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
