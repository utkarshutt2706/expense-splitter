import { useCurrentUser } from '@app/hooks';
import type { SplitType, User } from '@data/entities';
import { Avatar, CurrencyInput } from '@shared/components';
import { formatCurrency, sortMembersByName } from '@shared/utils';

interface SplitParticipantListProps {
    readonly users: User[];
    readonly splitType: SplitType;
    readonly selectedIds: string[];
    readonly onToggle: (id: string) => void;
    readonly values: Record<string, string>;
    readonly onValueChange: (id: string, value: string) => void;
    readonly resolvedAmounts?: Record<string, number>;
    readonly emptyMessage?: string;
}

const inputConfigByType: Partial<
    Record<SplitType, { label: string; suffix?: string; step: string }>
> = {
    exact: { label: 'amount', step: '0.01' },
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
    resolvedAmounts = {},
    emptyMessage = "You don't have any friends yet — you can add members later.",
}: SplitParticipantListProps) {
    const { data: currentUser } = useCurrentUser();

    if (users.length === 0) {
        return <p className="text-muted-foreground text-sm">{emptyMessage}</p>;
    }

    const orderedUsers = sortMembersByName(users, {
        isCurrentUser: (user) => user.id === currentUser?.id,
    });

    const inputConfig = inputConfigByType[splitType];

    return (
        <ul className="flex flex-col gap-1">
            {orderedUsers.map((user) => {
                const isCurrentUser = user.id === currentUser?.id;
                const name = isCurrentUser ? 'You' : user.name;
                const isSelected = selectedIds.includes(user.id);
                const resolvedAmount = resolvedAmounts[user.id];

                return (
                    <li
                        key={user.id}
                        className="hover:bg-muted flex min-h-11 flex-wrap items-center gap-2 rounded-md px-2 py-1.5 sm:flex-nowrap"
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
                            <span className="text-surface-foreground min-w-0 truncate text-sm">
                                {name}
                            </span>
                        </label>
                        {inputConfig && isSelected && (
                            <div className="text-muted-foreground flex items-center gap-1 text-sm">
                                {splitType === 'exact' ? (
                                    <CurrencyInput
                                        step={inputConfig.step}
                                        min="0"
                                        placeholder="0.00"
                                        value={values[user.id] ?? ''}
                                        onChange={(event) =>
                                            onValueChange(user.id, event.target.value)
                                        }
                                        aria-label={`${name} ${inputConfig.label}`}
                                        aria-describedby={`split-currency-${user.id}`}
                                        containerClassName="min-h-9 w-24"
                                        className="py-1 pr-2 text-right"
                                    />
                                ) : (
                                    <input
                                        type="number"
                                        inputMode="decimal"
                                        step={inputConfig.step}
                                        min="0"
                                        placeholder="0"
                                        value={values[user.id] ?? ''}
                                        onChange={(event) =>
                                            onValueChange(user.id, event.target.value)
                                        }
                                        aria-label={`${name} ${inputConfig.label}`}
                                        className="border-border bg-surface text-surface-foreground focus-visible:ring-brand-500 w-16 rounded-md border px-2 py-1 text-right text-sm outline-none focus-visible:ring-2"
                                    />
                                )}
                                {inputConfig.suffix}
                                {splitType === 'exact' && (
                                    <span id={`split-currency-${user.id}`} className="sr-only">
                                        Amount is in rupees.
                                    </span>
                                )}
                            </div>
                        )}
                        {isSelected && resolvedAmount !== undefined && (
                            <span
                                className="text-surface-foreground ml-auto shrink-0 text-sm font-medium tabular-nums"
                                aria-label={`${name} receives ${formatCurrency(resolvedAmount)}`}
                            >
                                {formatCurrency(resolvedAmount)}
                            </span>
                        )}
                    </li>
                );
            })}
        </ul>
    );
}
