import type { User } from '@data/entities';
import { Avatar } from '@shared/components';
import { sortMembersByName } from '@shared/utils';

interface MemberCheckboxListProps {
    readonly users: User[];
    readonly selectedIds: string[];
    readonly onToggle: (id: string) => void;
    readonly emptyMessage?: string;
    readonly currentUserId?: string;
    readonly lockCurrentUser?: boolean;
    /**
     * Ids that sort above the other candidates, below the current user. The
     * group settings editor passes the group's membership as it was loaded —
     * not the live selection, so that ticking a checkbox does not make the row
     * jump out from under the pointer.
     */
    readonly priorityIds?: readonly string[];
}

export function MemberCheckboxList({
    users,
    selectedIds,
    onToggle,
    emptyMessage = "You don't have any friends yet — you can add members later.",
    currentUserId,
    lockCurrentUser = false,
    priorityIds,
}: MemberCheckboxListProps) {
    if (users.length === 0) {
        return <p className="text-muted-foreground text-sm">{emptyMessage}</p>;
    }

    const orderedUsers = sortMembersByName(users, {
        isCurrentUser: (user) => user.id === currentUserId,
        isPriority: priorityIds && ((user) => priorityIds.includes(user.id)),
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
