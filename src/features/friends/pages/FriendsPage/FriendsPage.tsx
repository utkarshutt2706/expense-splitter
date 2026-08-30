import * as Popover from '@radix-ui/react-popover';
import { ArrowRight, ChevronDown, Copy, Mail, Phone } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { Link } from 'react-router';
import { toast } from 'sonner';

import { useFriends, type Friend } from '@features/friends';
import {
    Avatar,
    FetchingIndicator,
    ResponsivePopoverContent,
    SearchInput,
    SearchInputSkeleton,
    Skeleton,
} from '@shared/components';
import { formatCurrency } from '@shared/utils';

function normalizedPhone(value: string): string {
    return value.replace(/\D/g, '');
}

function sortFriends(friends: Friend[]): Friend[] {
    return [...friends].sort(
        (left, right) => left.name.localeCompare(right.name) || left.id.localeCompare(right.id),
    );
}

function isMobileDevice(): boolean {
    const navigatorWithUserAgentData = navigator as Navigator & {
        userAgentData?: { mobile?: boolean };
    };
    if (typeof navigatorWithUserAgentData.userAgentData?.mobile === 'boolean') {
        return navigatorWithUserAgentData.userAgentData.mobile;
    }
    return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

type ContactActionProps = Readonly<{
    friendName: string;
    kind: 'email' | 'phone';
    value: string;
}>;

function ContactAction({ friendName, kind, value }: ContactActionProps) {
    const mobile = isMobileDevice();
    const Icon = kind === 'email' ? Mail : Phone;
    const label =
        kind === 'email' ? `Email ${friendName} at ${value}` : `Call ${friendName} at ${value}`;
    const nativeAction = kind === 'email' ? `mailto:${value}` : `tel:${value}`;

    async function copyContact() {
        const contactLabel = kind === 'email' ? 'Email address' : 'Phone number';
        try {
            await navigator.clipboard.writeText(value);
            toast.success(`${contactLabel} copied to clipboard.`);
        } catch {
            toast.error(`Could not copy the ${contactLabel.toLocaleLowerCase()}.`);
        }
    }

    const trigger = (
        <button
            type="button"
            aria-label={mobile ? `${label}; choose an action` : `${label}; copy ${kind}`}
            onClick={mobile ? undefined : () => void copyContact()}
            className="hover:text-surface-foreground focus-visible:ring-brand-500 inline-flex cursor-pointer items-center gap-1.5 rounded-sm text-left focus-visible:ring-2 focus-visible:outline-none sm:min-h-0"
        >
            <Icon aria-hidden="true" className="size-3.5 shrink-0" />
            <span className="min-w-0 break-all">{value}</span>
        </button>
    );

    if (!mobile) return trigger;

    return (
        <Popover.Root>
            <Popover.Trigger asChild>{trigger}</Popover.Trigger>
            <Popover.Portal>
                <ResponsivePopoverContent
                    align="start"
                    sideOffset={8}
                    aria-label={`Choose an action for ${value}`}
                    className="border-border bg-surface z-50 w-56 rounded-lg border p-2 shadow-lg"
                >
                    <button
                        type="button"
                        onClick={() => void copyContact()}
                        className="hover:bg-muted focus-visible:bg-muted flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-md px-3 text-left outline-none"
                    >
                        <Copy aria-hidden="true" className="size-4" />
                        Copy {kind}
                    </button>
                    <a
                        href={nativeAction}
                        className="hover:bg-muted focus-visible:bg-muted flex min-h-11 items-center gap-3 rounded-md px-3 outline-none"
                    >
                        <Icon aria-hidden="true" className="size-4" />
                        {kind === 'email' ? 'Send email' : 'Call phone'}
                    </a>
                </ResponsivePopoverContent>
            </Popover.Portal>
        </Popover.Root>
    );
}

function FriendsListSkeleton() {
    return (
        <output aria-label="Loading friends…" className="block space-y-3">
            {[0, 1, 2, 3].map((item) => (
                <div
                    key={item}
                    className="border-border flex min-h-20 items-center gap-4 rounded-xl border p-4"
                >
                    <Skeleton className="size-11 shrink-0 rounded-full" />
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                        <Skeleton className="h-5 w-36 max-w-full" />
                        <Skeleton className="h-4 w-56 max-w-full" />
                    </div>
                    <Skeleton className="hidden h-4 w-28 sm:block" />
                </div>
            ))}
        </output>
    );
}

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

function FriendRow({ friend }: Readonly<{ friend: Friend }>) {
    const sharedGroupText =
        friend.sharedGroupCount === undefined
            ? 'Shared-group details unavailable'
            : `${friend.sharedGroupCount} shared ${friend.sharedGroupCount === 1 ? 'group' : 'groups'}`;
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

export function FriendsPage() {
    const { data: friends, isLoading, isFetching, isError, refetch } = useFriends();
    const [search, setSearch] = useState('');
    const hasNoFriends = !isLoading && (!friends || friends.length === 0);
    const isRefreshing = !isLoading && isFetching;
    const query = search.trim().toLowerCase();
    const phoneQuery = normalizedPhone(query);
    const filteredFriends = sortFriends(friends ?? []).filter(
        (friend) =>
            !query ||
            friend.name.toLowerCase().includes(query) ||
            friend.email?.toLowerCase().includes(query) ||
            (phoneQuery.length > 0 && normalizedPhone(friend.phone ?? '').includes(phoneQuery)),
    );

    let content: ReactNode;
    if (isLoading) content = <FriendsListSkeleton />;
    else if (isError) {
        content = (
            <div role="alert" className="border-border rounded-xl border p-8 text-center">
                <h2 className="text-xl font-semibold">We couldn’t load your friends.</h2>
                <button
                    type="button"
                    onClick={() => void refetch()}
                    className="text-brand-700 dark:text-brand-300 mt-3 min-h-11 cursor-pointer font-semibold underline underline-offset-4"
                >
                    Try again
                </button>
            </div>
        );
    } else if (!friends?.length) {
        content = (
            <div className="border-border rounded-xl border p-8 text-center">
                <h2 className="text-2xl font-semibold">No friends yet</h2>
                <p className="text-muted-foreground mt-2">
                    People you share a group with will appear here automatically.
                </p>
                <p className="text-muted-foreground">Create a group to get started.</p>
                <Link
                    to="/groups"
                    className="bg-brand-600 hover:bg-brand-700 focus-visible:ring-brand-500 mt-5 inline-flex min-h-11 items-center rounded-lg px-4 font-semibold text-white focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                    Create group
                </Link>
            </div>
        );
    } else if (!filteredFriends.length) {
        content = (
            <div className="border-border rounded-xl border p-8 text-center">
                <h2 className="text-2xl font-semibold">No friends found</h2>
                <p className="text-muted-foreground mt-2">
                    Try a different name, email, or phone number.
                </p>
                <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="text-brand-700 dark:text-brand-300 mt-3 min-h-11 cursor-pointer font-semibold underline underline-offset-4"
                >
                    Clear search
                </button>
            </div>
        );
    } else {
        content = (
            <ul className="space-y-3">
                {filteredFriends.map((friend) => (
                    <FriendRow key={friend.id} friend={friend} />
                ))}
            </ul>
        );
    }

    return (
        <div className="mx-auto max-w-5xl">
            {/* <p className="text-muted-foreground mb-4">People you’ve shared a group with.</p> */}
            <div className="mb-4 flex items-center gap-3">
                {isLoading ? (
                    <SearchInputSkeleton />
                ) : (
                    !hasNoFriends && (
                        <SearchInput
                            value={search}
                            onChange={setSearch}
                            placeholder="Search friends…"
                            ariaLabel="Search friends — people you’ve shared groups with"
                            className="max-w-sm"
                        />
                    )
                )}
                {isRefreshing && <FetchingIndicator />}
            </div>
            {content}
        </div>
    );
}
