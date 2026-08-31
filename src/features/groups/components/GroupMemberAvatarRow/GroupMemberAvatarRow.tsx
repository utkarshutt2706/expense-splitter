import type { User } from '@features/users/api/usersApi';
import { Avatar } from '@shared/components';

export type GroupMemberAvatarRowProps = Readonly<{
    members: User[];
    maxVisible: number;
    className: string;
    testId: string;
}>;

export function GroupMemberAvatarRow({
    members,
    maxVisible,
    className,
    testId,
}: GroupMemberAvatarRowProps) {
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
