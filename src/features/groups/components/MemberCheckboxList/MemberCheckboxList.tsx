import type { User } from '@features/users/api/usersApi';
import { Avatar } from '@shared/components';
import { participantNameMap, sortMembersByName } from '@shared/utils';

type MemberCheckboxListProps = Readonly<{
    users: User[];
    selectedIds: string[];
    onToggle: (id: string) => void;
    emptyMessage?: string;
    currentUserId?: string;
    lockCurrentUser?: boolean;
    /**
     * Ids that sort above the other candidates, below the current user. The
     * group settings editor passes the group's membership as it was loaded —
     * not the live selection, so that ticking a checkbox does not make the row
     * jump out from under the pointer.
     */
    priorityIds?: readonly string[];
}>;

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
    const names = participantNameMap(orderedUsers, currentUserId);

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
                                aria-label={isCurrentUser ? 'You' : user.name}
                                checked={isLocked || selectedIds.includes(user.id)}
                                disabled={isLocked}
                                onChange={() => onToggle(user.id)}
                                className="accent-brand-600 size-4 cursor-pointer disabled:cursor-not-allowed"
                            />
                            <span aria-hidden="true">
                                <Avatar name={user.name} />
                            </span>
                            <span className="text-surface-foreground text-sm">
                                {names.get(user.id)}
                            </span>
                        </label>
                    </li>
                );
            })}
        </ul>
    );
}
