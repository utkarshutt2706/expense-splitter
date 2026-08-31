import * as Popover from '@radix-ui/react-popover';

import { useCurrentUser } from '@app/hooks';
import { GroupMemberAvatarRow } from '@features/groups/components/GroupMemberAvatarRow';
import type { User } from '@features/users/api/usersApi';
import { ResponsivePopoverContent } from '@shared/components';
import { sortMembersByName } from '@shared/utils';
import { MemberList } from '../MemberList';

type GroupMembersStackProps = Readonly<{
    members: User[];
    maxVisible?: number;
    maxVisibleMobile?: number;
}>;

export function GroupMembersStack({
    members,
    maxVisible = 5,
    maxVisibleMobile = 2,
}: GroupMembersStackProps) {
    const { data: currentUser } = useCurrentUser();
    const orderedMembers = sortMembersByName(members, {
        isCurrentUser: (member) => member.id === currentUser?.id,
    });

    return (
        <Popover.Root>
            <Popover.Trigger asChild>
                <button
                    type="button"
                    aria-label={`Show all ${members.length} members`}
                    title={`Show all ${members.length} members`}
                    className="inline-flex cursor-pointer items-center rounded-full"
                >
                    <GroupMemberAvatarRow
                        members={orderedMembers}
                        maxVisible={maxVisibleMobile}
                        className="flex md:hidden"
                        testId="members-mobile"
                    />
                    <GroupMemberAvatarRow
                        members={orderedMembers}
                        maxVisible={maxVisible}
                        className="hidden md:flex"
                        testId="members-desktop"
                    />
                </button>
            </Popover.Trigger>
            <Popover.Portal>
                <ResponsivePopoverContent
                    align="start"
                    sideOffset={8}
                    className="border-border bg-surface z-50 w-64 rounded-lg border p-2 shadow-lg"
                >
                    <MemberList members={members} className="max-h-64 overflow-y-auto" />
                </ResponsivePopoverContent>
            </Popover.Portal>
        </Popover.Root>
    );
}
