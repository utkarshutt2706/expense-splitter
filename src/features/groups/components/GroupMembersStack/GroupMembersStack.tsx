import * as Popover from '@radix-ui/react-popover';

import { useCurrentUser } from '@app/hooks';
import type { User } from '@features/users/api/usersApi';
import { Avatar, ResponsivePopoverContent } from '@shared/components';
import { sortMembersByName } from '@shared/utils';
import { MemberList } from '../MemberList';

type GroupMembersStackProps = Readonly<{
    members: User[];
    maxVisible?: number;
    maxVisibleMobile?: number;
}>;

type AvatarRowProps = Readonly<{
    members: User[];
    maxVisible: number;
    className: string;
    testId: string;
}>;

function AvatarRow({ members, maxVisible, className, testId }: AvatarRowProps) {
    const visible = members.slice(0, maxVisible);
    const overflowCount = members.length - visible.length;

    return (
        <div data-testid={testId} className={`-space-x-3 ${className}`}>
            {visible.map((member) => (
                <span key={member.id} className="ring-surface rounded-full ring-2">
                    <Avatar name={member.name} />
                </span>
            ))}
            {overflowCount > 0 && (
                <span className="border-border bg-surface text-surface-foreground ring-surface flex size-9 items-center justify-center rounded-full border text-sm font-medium ring-2">
                    +{overflowCount}
                </span>
            )}
        </div>
    );
}

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
                    <AvatarRow
                        members={orderedMembers}
                        maxVisible={maxVisibleMobile}
                        className="flex md:hidden"
                        testId="members-mobile"
                    />
                    <AvatarRow
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
