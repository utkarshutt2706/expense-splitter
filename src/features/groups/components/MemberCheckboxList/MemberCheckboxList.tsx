import type { User } from '@data/entities';
import { Avatar } from '@shared/components';

interface MemberCheckboxListProps {
    readonly users: User[];
    readonly selectedIds: string[];
    readonly onToggle: (id: string) => void;
    readonly emptyMessage?: string;
}

export function MemberCheckboxList({
    users,
    selectedIds,
    onToggle,
    emptyMessage = "You don't have any friends yet — you can add members later.",
}: MemberCheckboxListProps) {
    if (users.length === 0) {
        return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
    }

    return (
        <ul className="flex max-h-48 flex-col gap-1 overflow-y-auto">
            {users.map((user) => (
                <li key={user.id}>
                    <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted">
                        <input
                            type="checkbox"
                            checked={selectedIds.includes(user.id)}
                            onChange={() => onToggle(user.id)}
                            className="size-4 cursor-pointer accent-brand-600"
                        />
                        <Avatar name={user.name} />
                        <span className="text-sm text-surface-foreground">{user.name}</span>
                    </label>
                </li>
            ))}
        </ul>
    );
}
