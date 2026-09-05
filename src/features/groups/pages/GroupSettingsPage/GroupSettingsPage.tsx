import { ArrowLeft, LogOut, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { Link, useParams } from 'react-router';

import { useCurrentUser } from '@app/hooks';
import { useGroupBalances } from '@features/balances/hooks/useGroupBalances';
import { useGroup, useGroupMembers } from '@features/groups';
import { EditGroupMembersAction } from '@features/groups/components/EditGroupMembersAction';
import { GroupNameEditor } from '@features/groups/components/GroupNameEditor';
import { MemberList } from '@features/groups/components/MemberList';
import { MemberListSkeleton } from '@features/groups/components/MemberListSkeleton';
import { useGroupSettingsActions } from '@features/groups/hooks/useGroupSettingsActions';
import { groupErrorMessage } from '@features/groups/utils/groupErrorMessage';
import { ConfirmationDialog, Skeleton } from '@shared/components';

export function GroupSettingsPage() {
    const { groupId } = useParams<{ groupId: string }>();
    const { data: currentUser } = useCurrentUser();
    const { data: group, isLoading: isGroupLoading, isError, error } = useGroup(groupId ?? '');
    const { data: members, isLoading: isMembersLoading } = useGroupMembers(group?.memberIds ?? []);
    const { data: groupBalances } = useGroupBalances(groupId ?? '');
    const [isEditingName, setIsEditingName] = useState(false);

    const balances = groupBalances?.balances ?? [];
    const actions = useGroupSettingsActions(group, currentUser, balances);

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
                        disabled={!actions.canLeave || actions.leavePending}
                        title={
                            actions.canLeave
                                ? undefined
                                : 'Settle your balance before leaving this group'
                        }
                        onClick={() => actions.setIsConfirmingLeave(true)}
                        className="border-border text-surface-foreground hover:bg-muted flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border p-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <LogOut className="size-4" />
                        Leave group
                    </button>
                    <button
                        type="button"
                        disabled={!actions.canDelete || actions.deletePending}
                        title={
                            actions.canDelete
                                ? undefined
                                : 'Everyone must be settled up before deleting this group'
                        }
                        onClick={() => actions.setIsConfirmingDelete(true)}
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
                to={groupId ? `/groups/${groupId}` : '/groups'}
                className="text-muted-foreground hover:text-surface-foreground mb-4 inline-flex items-center gap-1 text-sm"
            >
                <ArrowLeft className="size-4" />
                Back to group
            </Link>

            {content}

            <ConfirmationDialog
                open={actions.isConfirmingLeave}
                onOpenChange={actions.setIsConfirmingLeave}
                title="Leave this group?"
                description="Another member will need to add you back before you can rejoin."
                confirmLabel="Leave"
                destructive
                onConfirm={actions.leaveGroup}
            />

            <ConfirmationDialog
                open={actions.isConfirmingDelete}
                onOpenChange={actions.setIsConfirmingDelete}
                title={`Delete "${group?.name ?? 'this group'}"?`}
                description="This permanently removes the group and all of its expenses, splits, and payments."
                confirmLabel="Delete"
                destructive
                onConfirm={actions.removeGroup}
            />
        </div>
    );
}
