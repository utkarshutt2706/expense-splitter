import * as Popover from '@radix-ui/react-popover';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { Link } from 'react-router';

import type { Friend } from '@features/friends/api/friendsApi';
import { ContactAction } from '@features/friends/components/ContactAction';
import { Avatar, ResponsivePopoverContent } from '@shared/components';
import { formatCurrency } from '@shared/utils';

function friendNetStatus(friend: Friend): { label: string; className: string } {
    const netBalance = friend.netBalance ?? 0;
    if (netBalance > 0) {
        return {
            label: `Owes you ${formatCurrency(netBalance)}`,
            className: 'text-green-700 dark:text-green-400',
        };
    }
    if (netBalance < 0) {
        return {
            label: `You owe ${formatCurrency(Math.abs(netBalance))}`,
            className: 'text-red-600 dark:text-red-400',
        };
    }
    return {
        label: (friend.groupBalances?.length ?? 0) > 0 ? 'Net settled' : 'Settled up',
        className: 'text-muted-foreground',
    };
}

export type FriendRowProps = Readonly<{ friend: Friend }>;

export function FriendRow({ friend }: FriendRowProps) {
    let sharedGroupText = 'Shared-group details unavailable';
    if (friend.sharedGroupCount !== undefined) {
        const groupLabel = friend.sharedGroupCount === 1 ? 'group' : 'groups';
        sharedGroupText = `${friend.sharedGroupCount} shared ${groupLabel}`;
    }
    const groupBalances = friend.groupBalances ?? [];
    const { label: netStatus, className: netStatusClass } = friendNetStatus(friend);

    return (
        <li className="border-border flex min-h-20 min-w-0 items-start gap-3 rounded-xl border p-3 sm:items-center sm:gap-4 sm:p-4">
            <Avatar name={friend.name} />
            <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between sm:gap-6">
                <div className="min-w-0">
                    <p className="text-surface-foreground font-semibold break-words">
                        {friend.name}
                    </p>
                    <div className="text-muted-foreground mt-0.5 flex min-w-0 flex-wrap gap-x-3 text-sm">
                        {friend.email && (
                            <ContactAction
                                friendName={friend.name}
                                kind="email"
                                value={friend.email}
                            />
                        )}
                        {friend.phone && (
                            <ContactAction
                                friendName={friend.name}
                                kind="phone"
                                value={friend.phone}
                            />
                        )}
                    </div>
                </div>
                <div className="mt-1 shrink-0 sm:mt-0 sm:text-right">
                    {groupBalances.length > 0 ? (
                        <Popover.Root>
                            <Popover.Trigger asChild>
                                <button
                                    type="button"
                                    aria-label={`View balance breakdown with ${friend.name}`}
                                    className={`focus-visible:ring-brand-500 inline-flex min-h-8 cursor-pointer items-center gap-1 rounded-md font-semibold underline decoration-current/30 underline-offset-4 focus-visible:ring-2 focus-visible:outline-none sm:min-h-0 ${netStatusClass}`}
                                >
                                    {netStatus}
                                    <ChevronDown aria-hidden="true" className="size-4" />
                                </button>
                            </Popover.Trigger>
                            <Popover.Portal>
                                <ResponsivePopoverContent
                                    align="start"
                                    sideOffset={8}
                                    collisionPadding={16}
                                    aria-label={`Balance breakdown with ${friend.name}`}
                                    className="border-border bg-surface z-50 w-80 max-w-[calc(100vw-6rem)] rounded-lg border p-2 shadow-lg"
                                >
                                    <p className="px-2 py-1 text-sm font-semibold">
                                        Balance by group
                                    </p>
                                    <ul className="mt-1 max-h-72 overflow-y-auto">
                                        {groupBalances.map((groupBalance) => {
                                            const isOwed = groupBalance.balance > 0;
                                            return (
                                                <li key={groupBalance.groupId}>
                                                    <Link
                                                        to={`/groups/${groupBalance.groupId}`}
                                                        className="hover:bg-muted focus-visible:bg-muted flex min-h-11 items-center justify-between gap-3 rounded-md px-2 outline-none"
                                                    >
                                                        <span className="min-w-0 truncate font-medium">
                                                            {groupBalance.groupName}
                                                        </span>
                                                        <span className="flex shrink-0 items-center gap-2">
                                                            <span
                                                                className={`text-sm ${isOwed ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                                                            >
                                                                {isOwed ? 'Owes you ' : 'You owe '}
                                                                {formatCurrency(
                                                                    Math.abs(groupBalance.balance),
                                                                )}
                                                            </span>
                                                            <ArrowRight
                                                                aria-hidden="true"
                                                                className="text-muted-foreground size-4"
                                                            />
                                                        </span>
                                                    </Link>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </ResponsivePopoverContent>
                            </Popover.Portal>
                        </Popover.Root>
                    ) : (
                        <p className={`font-semibold ${netStatusClass}`}>{netStatus}</p>
                    )}
                    <p className="text-muted-foreground text-sm">{sharedGroupText}</p>
                </div>
            </div>
        </li>
    );
}
