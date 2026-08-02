import { ArrowLeft, Settings } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router';

import { GroupActivityList, GroupBalanceSummary } from '@features/expenses';
import { useGroup, useGroupMembers } from '@features/groups';
import { GroupDetailHeaderSkeleton } from '@features/groups/components/GroupDetailHeaderSkeleton';
import { GroupFabMenu } from '@features/groups/components/GroupFabMenu';
import { GroupMembersSection } from '@features/groups/components/GroupMembersSection';

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

    let content: ReactNode;
    if (isLoading) {
        content = (
            <output aria-label="Loading group…" className="flex items-center gap-3">
                <GroupDetailHeaderSkeleton />
            </output>
        );
    } else if (isError || !group) {
        content = <div className="text-red-600">Couldn't load this group.</div>;
    } else {
        content = (
            <div className="flex items-center gap-3">
                <h1 className="font-display text-surface-foreground text-xl font-medium">
                    {group.name}
                </h1>

                <GroupMembersSection
                    members={members ?? []}
                    isMembersLoading={isMembersLoading}
                    isMembersFetching={isMembersFetching}
                    isGroupFetching={isGroupFetching}
                />

                <Link
                    to={`/groups/${group.id}/settings`}
                    aria-label="Group settings"
                    title="Group settings"
                    className="border-border text-surface-foreground hover:bg-muted ml-auto inline-flex cursor-pointer items-center gap-1 rounded-md border p-2 text-sm font-medium md:px-3 md:py-1.5"
                >
                    <Settings className="size-4" />
                    <span className="hidden md:inline">Settings</span>
                </Link>
            </div>
        );
    }

    return (
        <div>
            <Link
                to="/groups"
                className="text-muted-foreground hover:text-surface-foreground mb-4 inline-flex items-center gap-1 text-sm"
            >
                <ArrowLeft className="size-4" />
                Back to groups
            </Link>

            {content}

            {!isError && (
                <div className="mt-6 mb-12 flex flex-col gap-6">
                    <GroupBalanceSummary groupId={groupId ?? ''} members={members ?? []} />

                    <div>
                        <h2 className="font-display text-surface-foreground mb-3 text-lg font-medium">
                            Activity
                        </h2>
                        <GroupActivityList
                            groupId={groupId ?? ''}
                            members={members ?? []}
                            isMembersLoading={isLoading || isMembersLoading}
                        />
                    </div>
                </div>
            )}

            {group && <GroupFabMenu groupId={group.id} members={members ?? []} />}
        </div>
    );
}
