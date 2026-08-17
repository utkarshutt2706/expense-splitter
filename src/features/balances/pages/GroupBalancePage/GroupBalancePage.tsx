import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router';

import { useGroup, useGroupMembers } from '@features/groups';
import { FetchingIndicator, Skeleton } from '@shared/components';
import { GroupBalanceAccordionList } from '../../components/GroupBalanceAccordionList';
import { GroupBalanceListSkeleton } from '../../components/GroupBalanceListSkeleton';
import { useGroupBalances } from '../../hooks/useGroupBalances';

export function GroupBalancePage() {
    const { groupId } = useParams<{ groupId: string }>();
    const {
        data: group,
        isLoading: isGroupLoading,
        isFetching: isGroupFetching,
        isError: isGroupError,
        refetch: refetchGroup,
    } = useGroup(groupId ?? '');
    const {
        data: members,
        isLoading: isMembersLoading,
        isFetching: isMembersFetching,
        isError: isMembersError,
        refetch: refetchMembers,
    } = useGroupMembers(group?.memberIds ?? []);
    const {
        data: groupBalances,
        isLoading: isBalancesLoading,
        isFetching: isBalancesFetching,
        isError: isBalancesError,
        refetch: refetchBalances,
    } = useGroupBalances(groupId ?? '');

    const isLoading = isGroupLoading || isMembersLoading || isBalancesLoading;
    const isError = isGroupError || isMembersError || isBalancesError;
    // isLoading only covers the very first fetch — settling up (or any other
    // mutation invalidating these queries) refetches in the background with
    // isLoading staying false, so without this the page would just silently sit
    // stale for the invalidated refetch's own latency.
    const isRefreshing = !isLoading && (isGroupFetching || isMembersFetching || isBalancesFetching);

    let content: ReactNode;
    if (isLoading) {
        content = (
            <output aria-label="Loading balances…" className="flex flex-col gap-3">
                <GroupBalanceListSkeleton />
            </output>
        );
    } else if (isError || !group) {
        content = (
            <div className="border-border rounded-xl border p-4" role="alert">
                <p className="font-medium text-red-600">We couldn’t load the group balances.</p>
                <p className="text-muted-foreground mt-1 text-sm">
                    Nothing was changed. Try again.
                </p>
                <button
                    type="button"
                    onClick={() => {
                        void refetchGroup();
                        void refetchMembers();
                        void refetchBalances();
                    }}
                    className="border-border hover:bg-muted mt-3 min-h-11 cursor-pointer rounded-md border px-4 py-2 text-sm font-medium"
                >
                    Retry
                </button>
            </div>
        );
    } else {
        const allMembers = members ?? [];
        const netBalances = new Map(
            (groupBalances?.balances ?? []).map((balance) => [balance.userId, balance.balance]),
        );
        const transactions = groupBalances?.settlements ?? [];

        content =
            (groupBalances?.balances.length ?? 0) === 0 && transactions.length === 0 ? (
                <div className="border-border rounded-xl border p-5">
                    <h2 className="font-display text-xl font-semibold">No balances yet</h2>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Add a shared expense to start tracking what everyone owes.
                    </p>
                    <Link
                        to={`/groups/${groupId}/expenses/new`}
                        className="bg-brand-600 hover:bg-brand-700 mt-4 inline-flex min-h-11 items-center rounded-md px-4 py-2 text-sm font-medium text-white"
                    >
                        Add expense
                    </Link>
                </div>
            ) : (
                <GroupBalanceAccordionList
                    groupId={groupId ?? ''}
                    members={allMembers}
                    netBalances={netBalances}
                    transactions={transactions}
                />
            );
    }

    return (
        <div className="mx-auto max-w-5xl">
            <Link
                to={`/groups/${groupId}`}
                className="text-muted-foreground hover:text-surface-foreground mb-3 inline-flex items-center gap-1 text-sm sm:mb-4"
            >
                <ArrowLeft className="size-4" />
                Back to group
            </Link>

            <h1 className="font-display text-surface-foreground flex items-center gap-2 text-2xl font-semibold">
                Balances
                {isRefreshing && <FetchingIndicator />}
            </h1>
            <div className="text-muted-foreground mt-1 mb-5 text-sm sm:mb-6">
                {isLoading ? <Skeleton className="h-4 w-32" /> : group?.name}
            </div>

            {content}
        </div>
    );
}
