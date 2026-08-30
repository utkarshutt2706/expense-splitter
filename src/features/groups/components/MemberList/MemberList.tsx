import { useCurrentUser } from '@app/hooks';
import type { User } from '@features/users/api/usersApi';
import { Avatar } from '@shared/components';
import { cn, participantNameMap, sortMembersByName } from '@shared/utils';

type MemberListProps = Readonly<{
    members: User[];
    className?: string;
}>;

// The current user always leads the list — same convention as GroupMembersStack's
// avatar rows and GroupBalanceAccordionList.
export function MemberList({ members, className }: MemberListProps) {
    const { data: currentUser } = useCurrentUser();
    const orderedMembers = sortMembersByName(members, {
        isCurrentUser: (member) => member.id === currentUser?.id,
    });
    const names = participantNameMap(orderedMembers, currentUser?.id);

    return (
        <ul className={cn('flex flex-col gap-1', className)}>
            {orderedMembers.map((member) => (
                <li key={member.id} className="flex items-center gap-2 rounded-md px-2 py-1.5">
                    <Avatar name={member.name} />
                    <div>
                        <p className="text-surface-foreground text-sm font-medium">
                            {names.get(member.id)}
                        </p>
                        {(member.email || member.phone) && (
                            <p className="text-muted-foreground text-xs">
                                {[member.email, member.phone].filter(Boolean).join(' · ')}
                            </p>
                        )}
                    </div>
                </li>
            ))}
        </ul>
    );
}
