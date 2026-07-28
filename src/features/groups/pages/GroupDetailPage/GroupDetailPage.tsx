import { ArrowLeft, Settings } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { Link, useParams } from 'react-router';

import { AddExpenseAction, ExpenseList, GroupBalanceSummary } from '@features/expenses';
import { useGroup, useGroupMembers } from '@features/groups';
import { GroupMembersSection } from '@features/groups/components/GroupMembersSection';
import { GroupNameEditor } from '@features/groups/components/GroupNameEditor';
import { MemberAvatarsSkeleton } from '@features/groups/components/MemberAvatarsSkeleton';
import { Skeleton } from '@shared/components';

export function GroupDetailPage() {
    const { groupId } = useParams<{ groupId: string }>();
    const {
        data: group,
        isLoading,
        isError,
        isFetching: isGroupFetching,
    } = useGroup(groupId ?? '');
    const {
        data: members,
        isLoading: isMembersLoading,
        isFetching: isMembersFetching,
    } = useGroupMembers(group?.memberIds ?? []);

    const [isEditingName, setIsEditingName] = useState(false);

    let content: ReactNode;
    if (isLoading) {
        content = (
            <output aria-label="Loading group…" className="flex items-center gap-3">
                <Skeleton className="h-9 w-40" />
                <MemberAvatarsSkeleton />
                <Skeleton className="ml-auto h-9 w-9 rounded-md md:w-32" />
            </output>
        );
    } else if (isError || !group) {
        content = <div className="text-red-600">Couldn't load this group.</div>;
    } else {
        content = (
            <div className="flex items-center gap-3">
                <GroupNameEditor
                    group={group}
                    isEditing={isEditingName}
                    onEditingChange={setIsEditingName}
                />

                {!isEditingName && (
                    <GroupMembersSection
                        group={group}
                        members={members ?? []}
                        isMembersLoading={isMembersLoading}
                        isMembersFetching={isMembersFetching}
                        isGroupFetching={isGroupFetching}
                    />
                )}

                <button
                    type="button"
                    aria-label="Group settings"
                    title="Group settings"
                    className={`ml-auto inline-flex cursor-pointer items-center gap-1 rounded-md border border-border p-2 text-sm font-medium text-surface-foreground hover:bg-muted md:px-3 md:py-1.5 ${isEditingName ? 'hidden md:inline-flex' : ''}`}
                >
                    <Settings className="size-4" />
                    <span className="hidden md:inline">Settings</span>
                </button>
            </div>
        );
    }

    return (
        <div>
            <Link
                to="/groups"
                className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-surface-foreground"
            >
                <ArrowLeft className="size-4" />
                Back to groups
            </Link>

            {content}

            {group && (
                <div className="mt-6 flex flex-col gap-6">
                    <GroupBalanceSummary groupId={group.id} />

                    <div>
                        <h2 className="mb-3 font-display text-lg font-medium text-surface-foreground">
                            Expenses
                        </h2>
                        <ExpenseList groupId={group.id} members={members ?? []} />
                    </div>
                </div>
            )}

            {group && <AddExpenseAction groupId={group.id} members={members ?? []} />}
        </div>
    );
}
