import * as Popover from '@radix-ui/react-popover';
import { UserRoundPlus } from 'lucide-react';

import type { User } from '@data/entities';
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
                <span key={member.id} className="rounded-full ring-2 ring-surface">
                    <Avatar name={member.name} />
                </span>
            ))}
            {overflowCount > 0 && (
                <span className="flex size-9 items-center justify-center rounded-full border border-border bg-surface text-sm font-medium text-surface-foreground ring-2 ring-surface">
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
                        members={members}
                        maxVisible={maxVisibleMobile}
                        className="flex md:hidden"
                        testId="members-mobile"
                    />
                    <AvatarRow
                        members={members}
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
                    className="z-50 w-64 rounded-lg border border-border bg-surface p-2 shadow-lg"
                >
                    <ul className="flex max-h-64 flex-col gap-1 overflow-y-auto">
                        {members.map((member) => (
                            <li
                                key={member.id}
                                className="flex items-center gap-2 rounded-md px-2 py-1.5"
                            >
                                <Avatar name={member.name} />
                                <div>
                                    <p className="text-sm font-medium text-surface-foreground">
                                        {member.name}
                                    </p>
                                    {(member.email || member.phone) && (
                                        <p className="text-xs text-muted-foreground">
                                            {[member.email, member.phone]
                                                .filter(Boolean)
                                                .join(' · ')}
                                        </p>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                    <div className="mt-1 flex w-full border-t border-border">
                        <Popover.Close asChild>
                            <button
                                type="button"
                                onClick={onEditMembers}
                                className="mt-1 flex w-full cursor-pointer items-center gap-2 rounded-md px-2 pt-2 pb-1.5 text-sm font-medium text-brand-600 hover:bg-muted"
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
