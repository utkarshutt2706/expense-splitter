import { UserRoundPlus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import type { Group, User } from '@data/entities';
import { useFriends } from '@features/friends';
import { useUpdateGroupMembers } from '@features/groups/hooks/useUpdateGroupMembers';
import { EditGroupMembersDialog } from '../EditGroupMembersDialog';

interface EditGroupMembersActionProps {
    readonly group: Group;
    readonly members: User[];
}

export function EditGroupMembersAction({ group, members }: EditGroupMembersActionProps) {
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

    return (
        <>
            <button
                type="button"
                onClick={() => setIsEditingMembers(true)}
                className="border-border text-surface-foreground hover:bg-muted flex w-full cursor-pointer items-center gap-2 rounded-md border p-3 text-sm font-medium"
            >
                <UserRoundPlus className="size-4" />
                Add/Remove members
            </button>

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
