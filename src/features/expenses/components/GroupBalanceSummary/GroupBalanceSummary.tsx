import { Link } from 'react-router';

import { useCurrentUser } from '@app/hooks';
import type { User } from '@data/entities';
import { useGroupBalances } from '@features/balances/hooks/useGroupBalances';
import { FetchingIndicator, Skeleton } from '@shared/components';

interface GroupBalanceSummaryProps {
    readonly groupId: string;
    readonly members: User[];
}

export function GroupBalanceSummary({ groupId, members }: GroupBalanceSummaryProps) {
    const { data: currentUser } = useCurrentUser();
    const {
        data: groupBalances,
        isLoading: isBalancesLoading,
        isFetching: isBalancesFetching,
        isError: isBalancesError,
    } = useGroupBalances(groupId);

    if (isBalancesLoading) {
        return <Skeleton className="h-7 w-48" />;
    }

    if (isBalancesError) {
        return <p className="text-muted-foreground text-sm">Couldn't load balance.</p>;
    }

    // isLoading only covers the very first fetch — a mutation invalidating these
    // queries (recording a payment, settling up) refetches in the background with
    // isLoading staying false the whole time, so without this the balance would
    // just silently sit stale for the invalidated refetch's own latency.
    const isRefreshing = isBalancesFetching;

    const balancesByUserId = new Map(
        (groupBalances?.balances ?? []).map((balance) => [balance.userId, balance.balance]),
    );
    const balance = balancesByUserId.get(currentUser?.id ?? '') ?? 0;
    // members is briefly [] while useGroupMembers is still loading (this component's
    // own balances query can resolve first) — members.every() on an empty array is
    // vacuously true, so guard against treating that transient state as "settled".
    const isGroupFullySettled =
        members.length > 0 &&
        members.every((member) => (balancesByUserId.get(member.id) ?? 0) === 0);

    // A fully settled group implies the current user's own balance is zero too, so
    // showing both "You're all settled up" and the celebratory note would just be
    // saying the same thing twice — the celebratory note alone is enough.
    if (isGroupFullySettled) {
        return (
            <span className="font-display text-settled inline-flex items-center gap-2 text-lg font-medium">
                🎉 This group is all settled
                {isRefreshing && <FetchingIndicator />}
            </span>
        );
    }

    let text: string;
    let className: string;
    if (balance > 0) {
        text = `You are owed ₹${balance.toFixed(2)}`;
        className = 'text-owed';
    } else if (balance < 0) {
        text = `You owe ₹${Math.abs(balance).toFixed(2)}`;
        className = 'text-owe';
    } else {
        text = "You're all settled up";
        className = 'text-settled';
    }

    return (
        <span
            className={`font-display inline-flex items-center gap-2 text-lg font-medium ${className}`}
        >
            {text}
            <Link
                to={`/groups/${groupId}/balance`}
                className="text-muted-foreground hover:text-surface-foreground text-base font-normal hover:underline"
            >
                Click to view details
            </Link>
            {isRefreshing && <FetchingIndicator />}
        </span>
    );
}
