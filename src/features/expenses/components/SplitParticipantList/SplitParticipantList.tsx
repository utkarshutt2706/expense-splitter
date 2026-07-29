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
        return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
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
                        className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted"
                    >
                        <label className="flex flex-1 cursor-pointer items-center gap-2">
                            <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => onToggle(user.id)}
                                className="size-4 cursor-pointer accent-brand-600"
                            />
                            <span aria-hidden="true">
                                <Avatar name={user.name} />
                            </span>
                            <span className="text-sm text-surface-foreground">{name}</span>
                        </label>
                        {inputConfig && isSelected && (
                            <span className="flex items-center gap-1 text-sm text-muted-foreground">
                                {inputConfig.prefix}
                                <input
                                    type="number"
                                    step={inputConfig.step}
                                    min="0"
                                    placeholder="0"
                                    value={values[user.id] ?? ''}
                                    onChange={(event) => onValueChange(user.id, event.target.value)}
                                    aria-label={`${name} ${inputConfig.label}`}
                                    className="w-16 rounded-md border border-border bg-surface px-2 py-1 text-right text-sm text-surface-foreground outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
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
