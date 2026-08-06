import { ArrowLeft, LogOut, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';

import { useCurrentUser } from '@app/hooks';
import { useGroupBalances } from '@features/balances/hooks/useGroupBalances';
import { useGroup, useGroupMembers } from '@features/groups';
import { EditGroupMembersAction } from '@features/groups/components/EditGroupMembersAction';
import { GroupNameEditor } from '@features/groups/components/GroupNameEditor';
import { MemberList } from '@features/groups/components/MemberList';
import { MemberListSkeleton } from '@features/groups/components/MemberListSkeleton';
import { useDeleteGroup } from '@features/groups/hooks/useDeleteGroup';
import { useUpdateGroupMembers } from '@features/groups/hooks/useUpdateGroupMembers';
import { groupErrorMessage } from '@features/groups/utils/groupErrorMessage';
import { ConfirmationDialog, Skeleton } from '@shared/components';

export function GroupSettingsPage() {
    const { groupId } = useParams<{ groupId: string }>();
    const navigate = useNavigate();
    const { data: currentUser } = useCurrentUser();
    const { data: group, isLoading: isGroupLoading, isError, error } = useGroup(groupId ?? '');
    const { data: members, isLoading: isMembersLoading } = useGroupMembers(group?.memberIds ?? []);
    const { data: groupBalances } = useGroupBalances(groupId ?? '');
    const updateGroupMembers = useUpdateGroupMembers();
    const deleteGroup = useDeleteGroup();
    const [isEditingName, setIsEditingName] = useState(false);
    const [isConfirmingLeave, setIsConfirmingLeave] = useState(false);
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

    const balances = groupBalances?.balances ?? [];
    const myBalance = balances.find((entry) => entry.userId === currentUser?.id)?.balance ?? 0;
    const canLeave = myBalance === 0;
    const canDelete = balances.every((entry) => entry.balance === 0);

    const handleLeave = () => {
        if (!group || !currentUser) return;

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
                onError: (mutationError) => toast.error(mutationError.message, { id: toastId }),
            },
        );
    };

    const handleDeleteGroup = () => {
        if (!group) return;

        const toastId = toast.loading('Group is being deleted…');
        deleteGroup.mutate(group.id, {
            onSuccess: () => {
                toast.success('Group deleted', { id: toastId });
                navigate('/groups');
            },
            onError: (mutationError) => toast.error(mutationError.message, { id: toastId }),
        });
    };

    let content: ReactNode;
    if (isGroupLoading) {
        content = (
            <output aria-label="Loading group settings…" className="flex flex-col gap-6">
                <Skeleton className="h-9 w-40" />

                <div className="flex flex-col gap-3">
                    <Skeleton className="h-11 w-full" />
                    <MemberListSkeleton />
                </div>

                <div className="border-border flex flex-col gap-3 border-t pt-6 sm:flex-row">
                    <Skeleton className="h-11 w-full sm:flex-1" />
                    <Skeleton className="h-11 w-full sm:flex-1" />
                </div>
            </output>
        );
    } else if (isError || !group) {
        content = <div className="text-red-600">{groupErrorMessage(error)}</div>;
    } else {
        content = (
            <div className="flex flex-col gap-6">
                <div className="flex items-center gap-3">
                    <GroupNameEditor
                        group={group}
                        isEditing={isEditingName}
                        onEditingChange={setIsEditingName}
                    />
                </div>

                <div className="flex flex-col gap-3">
                    <EditGroupMembersAction group={group} members={members ?? []} />
                    {isMembersLoading ? (
                        <MemberListSkeleton />
                    ) : (
                        <MemberList members={members ?? []} />
                    )}
                </div>

                <div className="border-border flex flex-col gap-3 border-t pt-6 sm:flex-row">
                    <button
                        type="button"
                        disabled={!canLeave || updateGroupMembers.isPending}
                        title={
                            canLeave ? undefined : 'Settle your balance before leaving this group'
                        }
                        onClick={() => setIsConfirmingLeave(true)}
                        className="border-border text-surface-foreground hover:bg-muted flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border p-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <LogOut className="size-4" />
                        Leave group
                    </button>
                    <button
                        type="button"
                        disabled={!canDelete || deleteGroup.isPending}
                        title={
                            canDelete
                                ? undefined
                                : 'Everyone must be settled up before deleting this group'
                        }
                        onClick={() => setIsConfirmingDelete(true)}
                        className="border-border flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border p-3 text-sm font-medium text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <Trash2 className="size-4" />
                        Delete group
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div>
            <Link
                to={`/groups/${groupId}`}
                className="text-muted-foreground hover:text-surface-foreground mb-4 inline-flex items-center gap-1 text-sm"
            >
                <ArrowLeft className="size-4" />
                Back to group
            </Link>

            {content}

            <ConfirmationDialog
                open={isConfirmingLeave}
                onOpenChange={setIsConfirmingLeave}
                title="Leave this group?"
                description="You'll need a new invite or to be added back by another member to rejoin."
                confirmLabel="Leave"
                destructive
                onConfirm={() => {
                    setIsConfirmingLeave(false);
                    handleLeave();
                }}
            />

            <ConfirmationDialog
                open={isConfirmingDelete}
                onOpenChange={setIsConfirmingDelete}
                title={`Delete "${group?.name ?? 'this group'}"?`}
                description="This permanently removes the group and all of its expenses, splits, and payments."
                confirmLabel="Delete"
                destructive
                onConfirm={() => {
                    setIsConfirmingDelete(false);
                    handleDeleteGroup();
                }}
            />
        </div>
    );
}
