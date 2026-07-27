import { useState } from 'react';
import { toast } from 'sonner';

import type { Group, User } from '@data/entities';
import { useFriends } from '@features/friends';
import { useUpdateGroupMembers } from '@features/groups/hooks/useUpdateGroupMembers';
import { EditGroupMembersDialog } from '../EditGroupMembersDialog';
import { GroupMembersStack } from '../GroupMembersStack';
import { MemberAvatarsSkeleton } from '../MemberAvatarsSkeleton';

interface GroupMembersSectionProps {
    readonly group: Group;
    readonly members: User[];
    readonly isMembersLoading: boolean;
    readonly isMembersFetching: boolean;
    readonly isGroupFetching: boolean;
}

export function GroupMembersSection({
    group,
    members,
    isMembersLoading,
    isMembersFetching,
    isGroupFetching,
}: GroupMembersSectionProps) {
    const { data: friends } = useFriends();
    const updateMembers = useUpdateGroupMembers();
    const [isEditingMembers, setIsEditingMembers] = useState(false);

    const editableUsersById = new Map(
        [...(friends ?? []), ...members].map((user) => [user.id, user]),
    );
    const editableUsers = Array.from(editableUsersById.values());

    const handleUpdateMembers = ({ memberIds }: { memberIds: string[] }) => {
        const toastId = toast.loading('Group members are being updated…');
        updateMembers.mutate(
            { id: group.id, memberIds },
            {
                onSuccess: () => toast.success('Group members updated', { id: toastId }),
                onError: (error) => toast.error(error.message, { id: toastId }),
            },
        );
    };

    const isMembersRefreshing =
        isMembersLoading || isMembersFetching || isGroupFetching || updateMembers.isPending;

    return (
        <>
            {isMembersRefreshing ? (
                <MemberAvatarsSkeleton />
            ) : (
                <GroupMembersStack
                    members={members}
                    onEditMembers={() => setIsEditingMembers(true)}
                />
            )}

            <EditGroupMembersDialog
                open={isEditingMembers}
                onOpenChange={setIsEditingMembers}
                users={editableUsers}
                initialMemberIds={group.memberIds}
                onSubmit={handleUpdateMembers}
            />
        </>
    );
}
