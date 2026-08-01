import type { User } from '@data/entities';
import { Avatar } from '@shared/components';

interface MemberCheckboxListProps {
    readonly users: User[];
    readonly selectedIds: string[];
    readonly onToggle: (id: string) => void;
    readonly emptyMessage?: string;
    readonly currentUserId?: string;
    readonly lockCurrentUser?: boolean;
}

export function MemberCheckboxList({
    users,
    selectedIds,
    onToggle,
    emptyMessage = "You don't have any friends yet — you can add members later.",
    currentUserId,
    lockCurrentUser = false,
}: MemberCheckboxListProps) {
    if (users.length === 0) {
        return <p className="text-muted-foreground text-sm">{emptyMessage}</p>;
    }

    const orderedUsers = [...users].sort((a, b) => {
        if (a.id === currentUserId) return -1;
        if (b.id === currentUserId) return 1;
        return 0;
    });

    return (
        <ul className="flex max-h-48 flex-col gap-1 overflow-y-auto">
            {orderedUsers.map((user) => {
                const isCurrentUser = user.id === currentUserId;
                const isLocked = isCurrentUser && lockCurrentUser;

                return (
                    <li key={user.id}>
                        <label className="hover:bg-muted flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5">
                            <input
                                type="checkbox"
                                checked={isLocked || selectedIds.includes(user.id)}
                                disabled={isLocked}
                                onChange={() => onToggle(user.id)}
                                className="accent-brand-600 size-4 cursor-pointer disabled:cursor-not-allowed"
                            />
                            <span aria-hidden="true">
                                <Avatar name={user.name} />
                            </span>
                            <span className="text-surface-foreground text-sm">
                                {isCurrentUser ? 'You' : user.name}
                            </span>
                        </label>
                    </li>
                );
            })}
        </ul>
    );
}
