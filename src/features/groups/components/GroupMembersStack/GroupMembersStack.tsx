import * as Popover from '@radix-ui/react-popover';
import { UserRoundPlus } from 'lucide-react';

import type { User } from '@data/entities';
import { CURRENT_USER_ID } from '@data/seed';
import { Avatar } from '@shared/components';

interface GroupMembersStackProps {
    readonly members: User[];
    readonly maxVisible?: number;
    readonly maxVisibleMobile?: number;
    readonly onEditMembers?: () => void;
}

interface AvatarRowProps {
    readonly members: User[];
    readonly maxVisible: number;
    readonly className: string;
    readonly testId: string;
}

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
    onEditMembers,
}: GroupMembersStackProps) {
    const orderedMembers = [...members].sort((a, b) => {
        if (a.id === CURRENT_USER_ID) return -1;
        if (b.id === CURRENT_USER_ID) return 1;
        return 0;
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
                <Popover.Content
                    align="start"
                    sideOffset={8}
                    className="border-border bg-surface z-50 w-64 rounded-lg border p-2 shadow-lg"
                >
                    <ul className="flex max-h-64 flex-col gap-1 overflow-y-auto">
                        {orderedMembers.map((member) => (
                            <li
                                key={member.id}
                                className="flex items-center gap-2 rounded-md px-2 py-1.5"
                            >
                                <Avatar name={member.name} />
                                <div>
                                    <p className="text-surface-foreground text-sm font-medium">
                                        {member.id === CURRENT_USER_ID ? 'You' : member.name}
                                    </p>
                                    {(member.email || member.phone) && (
                                        <p className="text-muted-foreground text-xs">
                                            {[member.email, member.phone]
                                                .filter(Boolean)
                                                .join(' · ')}
                                        </p>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                    <div className="border-border mt-1 flex w-full border-t">
                        <Popover.Close asChild>
                            <button
                                type="button"
                                onClick={onEditMembers}
                                className="text-brand-600 hover:bg-muted mt-1 flex w-full cursor-pointer items-center gap-2 rounded-md px-2 pt-2 pb-1.5 text-sm font-medium"
                            >
                                <UserRoundPlus className="size-4" />
                                Add/Remove members
                            </button>
                        </Popover.Close>
                    </div>
                </Popover.Content>
            </Popover.Portal>
        </Popover.Root>
    );
}
