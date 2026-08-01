import { useCurrentUser } from '@app/hooks';
import type { User } from '@data/entities';
import { Avatar } from '@shared/components';
import { cn } from '@shared/utils';

interface MemberListProps {
    readonly members: User[];
    readonly className?: string;
}

// The current user always leads the list — same convention as GroupMembersStack's
// avatar rows and GroupBalanceAccordionList.
export function MemberList({ members, className }: MemberListProps) {
    const { data: currentUser } = useCurrentUser();
    const orderedMembers = [...members].sort((a, b) => {
        if (a.id === currentUser?.id) return -1;
        if (b.id === currentUser?.id) return 1;
        return 0;
    });

    return (
        <ul className={cn('flex flex-col gap-1', className)}>
            {orderedMembers.map((member) => (
                <li key={member.id} className="flex items-center gap-2 rounded-md px-2 py-1.5">
                    <Avatar name={member.name} />
                    <div>
                        <p className="text-surface-foreground text-sm font-medium">
                            {member.id === currentUser?.id ? 'You' : member.name}
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
