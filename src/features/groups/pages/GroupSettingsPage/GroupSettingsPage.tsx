import { ArrowLeft, LogOut, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { Link, useParams } from 'react-router';

import { useGroup, useGroupMembers } from '@features/groups';
import { EditGroupMembersAction } from '@features/groups/components/EditGroupMembersAction';
import { GroupNameEditor } from '@features/groups/components/GroupNameEditor';
import { MemberList } from '@features/groups/components/MemberList';
import { Skeleton } from '@shared/components';

export function GroupSettingsPage() {
    const { groupId } = useParams<{ groupId: string }>();
    const { data: group, isLoading, isError } = useGroup(groupId ?? '');
    const { data: members } = useGroupMembers(group?.memberIds ?? []);
    const [isEditingName, setIsEditingName] = useState(false);

    let content: ReactNode;
    if (isLoading) {
        content = (
            <output aria-label="Loading group settings…" className="flex flex-col gap-6">
                <Skeleton className="h-9 w-40" />
                <Skeleton className="h-11 w-full" />
            </output>
        );
    } else if (isError || !group) {
        content = <div className="text-red-600">Couldn't load this group.</div>;
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
                    <MemberList members={members ?? []} />
                </div>

                <div className="border-border flex flex-col gap-3 border-t pt-6 sm:flex-row">
                    <button
                        type="button"
                        disabled
                        title="Leave group (coming soon)"
                        className="border-border text-surface-foreground flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-md border p-3 text-sm font-medium opacity-60 sm:flex-1"
                    >
                        <LogOut className="size-4" />
                        Leave group
                    </button>
                    <button
                        type="button"
                        disabled
                        title="Delete group (coming soon)"
                        className="border-border flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-md border p-3 text-sm font-medium text-red-600 opacity-60 sm:flex-1"
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
        </div>
    );
}
