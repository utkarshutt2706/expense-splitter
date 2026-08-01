import type { SplitType, User } from '@data/entities';
import { CURRENT_USER_ID } from '@data/seed';
import { Avatar } from '@shared/components';

interface SplitParticipantListProps {
    readonly users: User[];
    readonly splitType: SplitType;
    readonly selectedIds: string[];
    readonly onToggle: (id: string) => void;
    readonly values: Record<string, string>;
    readonly onValueChange: (id: string, value: string) => void;
    readonly emptyMessage?: string;
}

const inputConfigByType: Partial<
    Record<SplitType, { label: string; prefix?: string; suffix?: string; step: string }>
> = {
    exact: { label: 'amount', prefix: '₹', step: '0.01' },
    percentage: { label: 'percentage', suffix: '%', step: '0.01' },
    shares: { label: 'shares', step: '1' },
};

export function SplitParticipantList({
    users,
    splitType,
    selectedIds,
    onToggle,
    values,
    onValueChange,
    emptyMessage = "You don't have any friends yet — you can add members later.",
}: SplitParticipantListProps) {
    if (users.length === 0) {
        return <p className="text-muted-foreground text-sm">{emptyMessage}</p>;
    }

    const orderedUsers = [...users].sort((a, b) => {
        if (a.id === CURRENT_USER_ID) return -1;
        if (b.id === CURRENT_USER_ID) return 1;
        return 0;
    });

    const inputConfig = inputConfigByType[splitType];

    return (
        <ul className="flex max-h-48 flex-col gap-1 overflow-y-auto">
            {orderedUsers.map((user) => {
                const isCurrentUser = user.id === CURRENT_USER_ID;
                const name = isCurrentUser ? 'You' : user.name;
                const isSelected = selectedIds.includes(user.id);

                return (
                    <li
                        key={user.id}
                        className="hover:bg-muted flex items-center gap-2 rounded-md px-2 py-1.5"
                    >
                        <label className="flex flex-1 cursor-pointer items-center gap-2">
                            <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => onToggle(user.id)}
                                className="accent-brand-600 size-4 cursor-pointer"
                            />
                            <span aria-hidden="true">
                                <Avatar name={user.name} />
                            </span>
                            <span className="text-surface-foreground text-sm">{name}</span>
                        </label>
                        {inputConfig && isSelected && (
                            <span className="text-muted-foreground flex items-center gap-1 text-sm">
                                {inputConfig.prefix}
                                <input
                                    type="number"
                                    step={inputConfig.step}
                                    min="0"
                                    placeholder="0"
                                    value={values[user.id] ?? ''}
                                    onChange={(event) => onValueChange(user.id, event.target.value)}
                                    aria-label={`${name} ${inputConfig.label}`}
                                    className="border-border bg-surface text-surface-foreground focus-visible:ring-brand-500 w-16 rounded-md border px-2 py-1 text-right text-sm outline-none focus-visible:ring-2"
                                />
                                {inputConfig.suffix}
                            </span>
                        )}
                    </li>
                );
            })}
        </ul>
    );
}
