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
    } = useGroup(groupId ?? '');
    const {
        data: members,
        isLoading: isMembersLoading,
        isFetching: isMembersFetching,
    } = useGroupMembers(group?.memberIds ?? []);
    const {
        data: groupBalances,
        isLoading: isBalancesLoading,
        isFetching: isBalancesFetching,
        isError: isBalancesError,
    } = useGroupBalances(groupId ?? '');

    const isLoading = isGroupLoading || isMembersLoading || isBalancesLoading;
    const isError = isGroupError || isBalancesError;
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
        content = <div className="text-red-600">Couldn't load balances.</div>;
    } else {
        const allMembers = members ?? [];
        const netBalances = new Map(
            (groupBalances?.balances ?? []).map((balance) => [balance.userId, balance.balance]),
        );
        const transactions = groupBalances?.settlements ?? [];

        content = (
            <GroupBalanceAccordionList
                groupId={groupId ?? ''}
                members={allMembers}
                netBalances={netBalances}
                transactions={transactions}
            />
        );
    }

    return (
        <div>
            <Link
                to={`/groups/${groupId}`}
                className="text-muted-foreground hover:text-surface-foreground mb-4 inline-flex items-center gap-1 text-sm"
            >
                <ArrowLeft className="size-4" />
                Back to group
            </Link>

            <h1 className="font-display text-surface-foreground mb-4 flex items-center gap-2 text-xl font-medium">
                {isLoading ? <Skeleton className="h-7 w-40" /> : (group?.name ?? 'Balances')}
                {isRefreshing && <FetchingIndicator />}
            </h1>

            {content}
        </div>
    );
}
