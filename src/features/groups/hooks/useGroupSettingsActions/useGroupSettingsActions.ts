import { useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

import type { MemberBalance } from '@features/balances/api/balancesApi';
import type { Group } from '@features/groups/api/groupsApi';
import { useDeleteGroup } from '@features/groups/hooks/useDeleteGroup';
import { useUpdateGroupMembers } from '@features/groups/hooks/useUpdateGroupMembers';
import type { User } from '@features/users/api/usersApi';

export function useGroupSettingsActions(
    group: Group | undefined,
    currentUser: User | undefined,
    balances: MemberBalance[],
) {
    const navigate = useNavigate();
    const updateGroupMembers = useUpdateGroupMembers();
    const deleteGroup = useDeleteGroup();
    const [isConfirmingLeave, setIsConfirmingLeave] = useState(false);
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
    const myBalance = balances.find((entry) => entry.userId === currentUser?.id)?.balance ?? 0;

    function leaveGroup() {
        if (!group || !currentUser) return;
        setIsConfirmingLeave(false);
        const toastId = toast.loading('Leaving group…');
        updateGroupMembers.mutate(
            {
                id: group.id,
                memberIds: group.memberIds.filter((memberId) => memberId !== currentUser.id),
            },
            {
                onSuccess: () => {
                    toast.success('Left group', { id: toastId });
                    navigate('/groups');
                },
                onError: (error) => toast.error(error.message, { id: toastId }),
            },
        );
    }

    function removeGroup() {
        if (!group) return;
        setIsConfirmingDelete(false);
        const toastId = toast.loading('Group is being deleted…');
        deleteGroup.mutate(group.id, {
            onSuccess: () => {
                toast.success('Group deleted', { id: toastId });
                navigate('/groups');
            },
            onError: (error) => toast.error(error.message, { id: toastId }),
        });
    }

    return {
        canDelete: balances.every((entry) => entry.balance === 0),
        canLeave: myBalance === 0,
        deletePending: deleteGroup.isPending,
        isConfirmingDelete,
        isConfirmingLeave,
        leaveGroup,
        leavePending: updateGroupMembers.isPending,
        removeGroup,
        setIsConfirmingDelete,
        setIsConfirmingLeave,
    };
}
