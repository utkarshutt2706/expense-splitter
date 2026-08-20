import { ChevronRight, Plus, UsersRound } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { Link } from 'react-router';
import { toast } from 'sonner';

import { useFriends } from '@features/friends';
import {
    CreateGroupDialog,
    useCreateGroup,
    useGroupSummaries,
    type CreateGroupFormValues,
    type GroupSummary,
} from '@features/groups';
import { ActionButtonSkeleton } from '@shared/components/ActionButtonSkeleton';
import { FetchingIndicator } from '@shared/components/FetchingIndicator';
import { SearchInput } from '@shared/components/SearchInput';
import { SearchInputSkeleton } from '@shared/components/SearchInputSkeleton';
import { Skeleton } from '@shared/components/Skeleton';
import { formatCurrency } from '@shared/utils';

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
});

function balanceStatus(group: GroupSummary): { text: string; className: string } {
    if (!group.hasFinancialActivity) {
        return { text: 'No balance', className: 'text-muted-foreground' };
    }
    if (group.currentUserBalance > 0) {
        return {
            text: `You are owed ${formatCurrency(group.currentUserBalance)}`,
            className: 'text-green-700 dark:text-green-400',
        };
    }
    if (group.currentUserBalance < 0) {
        return {
            text: `You owe ${formatCurrency(Math.abs(group.currentUserBalance))}`,
            className: 'text-red-600 dark:text-red-400',
        };
    }
    return { text: 'Settled up', className: 'text-muted-foreground' };
}

function sortGroups(groups: GroupSummary[]): GroupSummary[] {
    return [...groups].sort((left, right) => {
        if (left.lastActivityAt && right.lastActivityAt) {
            const difference =
                new Date(right.lastActivityAt).getTime() - new Date(left.lastActivityAt).getTime();
            if (difference !== 0) return difference;
        } else if (left.lastActivityAt) return -1;
        else if (right.lastActivityAt) return 1;
        return left.name.localeCompare(right.name);
    });
}

function GroupListSkeleton() {
    return (
        <output aria-label="Loading groups…" className="block space-y-3">
            {[0, 1, 2].map((item) => (
                <div
                    key={item}
                    className="border-border flex items-center gap-4 rounded-xl border p-4"
                >
                    <Skeleton className="size-11 shrink-0 rounded-full" />
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                        <Skeleton className="h-5 w-44 max-w-full" />
                        <Skeleton className="h-4 w-64 max-w-full" />
                    </div>
                    <Skeleton className="hidden h-5 w-36 sm:block" />
                </div>
            ))}
        </output>
    );
}

export function GroupsPage() {
    const { data: groups, isLoading, isFetching, isError, refetch } = useGroupSummaries();
    const { data: friends } = useFriends();
    const createGroup = useCreateGroup();
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [search, setSearch] = useState('');

    const hasNoGroups = !isLoading && (!groups || groups.length === 0);
    const isRefreshing = !isLoading && isFetching;
    const friendNameById = new Map((friends ?? []).map((friend) => [friend.id, friend.name]));
    const query = search.trim().toLowerCase();
    const filteredGroups = sortGroups(groups ?? []).filter(
        (group) =>
            !query ||
            group.name.toLowerCase().includes(query) ||
            group.memberIds.some((id) => friendNameById.get(id)?.toLowerCase().includes(query)),
    );

    const handleCreateGroup = (values: CreateGroupFormValues) => {
        const toastId = toast.loading('Group is being created…');
        createGroup.mutate(values, {
            onSuccess: () => toast.success('Group created', { id: toastId }),
            onError: (error) => toast.error(error.message, { id: toastId }),
        });
    };

    let content: ReactNode;
    if (isLoading) content = <GroupListSkeleton />;
    else if (isError) {
        content = (
            <div role="alert" className="border-border rounded-xl border p-8 text-center">
                <h2 className="text-xl font-semibold">We couldn’t load your groups.</h2>
                <button
                    type="button"
                    onClick={() => void refetch()}
                    className="text-brand-700 dark:text-brand-300 mt-3 min-h-11 cursor-pointer font-semibold underline underline-offset-4"
                >
                    Try again
                </button>
            </div>
        );
    } else if (!groups?.length) {
        content = (
            <div className="border-border rounded-xl border p-8 text-center">
                <h2 className="text-2xl font-semibold">No groups yet</h2>
                <p className="text-muted-foreground mt-2">
                    Create a group to start sharing expenses with other people.
                </p>
                <button
                    type="button"
                    onClick={() => setAddDialogOpen(true)}
                    className="bg-brand-600 hover:bg-brand-700 mt-5 min-h-11 cursor-pointer rounded-lg px-4 font-semibold text-white"
                >
                    Create group
                </button>
            </div>
        );
    } else if (!filteredGroups.length) {
        content = (
            <div className="border-border rounded-xl border p-8 text-center">
                <h2 className="text-2xl font-semibold">No groups found</h2>
                <p className="text-muted-foreground mt-2">Try a different search.</p>
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
                {filteredGroups.map((group) => {
                    const status = balanceStatus(group);
                    const activity = group.lastActivityAt
                        ? `Last activity ${dateFormatter.format(new Date(group.lastActivityAt))}`
                        : 'No expenses yet';
                    return (
                        <li key={group.id}>
                            <Link
                                to={`/groups/${group.id}`}
                                className="border-border hover:bg-muted focus-visible:ring-brand-500 flex min-h-20 items-start gap-3 rounded-xl border p-4 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none sm:items-center sm:gap-4"
                            >
                                <span
                                    aria-hidden="true"
                                    className="bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300 flex size-11 shrink-0 items-center justify-center rounded-full"
                                >
                                    <UsersRound className="size-5" />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="text-surface-foreground font-semibold break-words">
                                        {group.name}
                                    </p>
                                    <p className="text-muted-foreground mt-1 text-sm sm:inline">
                                        {group.memberCount}{' '}
                                        {group.memberCount === 1 ? 'member' : 'members'}
                                    </p>
                                    <span
                                        aria-hidden="true"
                                        className="text-muted-foreground hidden px-1.5 sm:inline"
                                    >
                                        ·
                                    </span>
                                    <p className="text-muted-foreground text-sm sm:inline">
                                        {activity}
                                    </p>
                                    <p
                                        className={`mt-3 font-semibold sm:hidden ${status.className}`}
                                    >
                                        {status.text}
                                    </p>
                                </div>
                                <div className="hidden shrink-0 items-center gap-3 sm:flex">
                                    <span className={`font-semibold ${status.className}`}>
                                        {status.text}
                                    </span>
                                    <ChevronRight
                                        aria-hidden="true"
                                        className="text-muted-foreground size-5"
                                    />
                                </div>
                                <ChevronRight
                                    aria-hidden="true"
                                    className="text-muted-foreground mt-1 size-5 shrink-0 sm:hidden"
                                />
                            </Link>
                        </li>
                    );
                })}
            </ul>
        );
    }

    return (
        <div className="mx-auto max-w-5xl">
            <div className="mb-4 flex items-center gap-3">
                {isLoading ? (
                    <SearchInputSkeleton />
                ) : (
                    !hasNoGroups && (
                        <SearchInput
                            value={search}
                            onChange={setSearch}
                            placeholder="Search groups…"
                            ariaLabel="Search groups"
                            className="max-w-sm flex-1"
                        />
                    )
                )}
                {isRefreshing && <FetchingIndicator />}
                {isLoading && <ActionButtonSkeleton className="ml-auto w-36" />}
                {!isLoading && !hasNoGroups && (
                    <button
                        type="button"
                        onClick={() => setAddDialogOpen(true)}
                        className="border-border hover:bg-muted ml-auto inline-flex min-h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg border px-4 text-sm font-semibold"
                    >
                        <Plus className="size-4" /> Create group
                    </button>
                )}
            </div>
            {content}
            <CreateGroupDialog
                open={addDialogOpen}
                onOpenChange={setAddDialogOpen}
                friends={friends ?? []}
                onSubmit={handleCreateGroup}
            />
        </div>
    );
}
