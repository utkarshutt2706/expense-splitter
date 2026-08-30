import type { User } from '@data/entities';
import { GroupMembersStack } from '../GroupMembersStack';
import { MemberAvatarsSkeleton } from '../MemberAvatarsSkeleton';

type GroupMembersSectionProps = Readonly<{
    members: User[];
    isMembersLoading: boolean;
    isMembersFetching: boolean;
    isGroupFetching: boolean;
}>;

// Purely a read-only display — editing membership lives on the group settings
// page (EditGroupMembersAction) now, not here.
export function GroupMembersSection({
    members,
    isMembersLoading,
    isMembersFetching,
    isGroupFetching,
}: GroupMembersSectionProps) {
    const isMembersRefreshing = isMembersLoading || isMembersFetching || isGroupFetching;

    return isMembersRefreshing ? (
        <MemberAvatarsSkeleton />
    ) : (
        <GroupMembersStack members={members} />
    );
}
