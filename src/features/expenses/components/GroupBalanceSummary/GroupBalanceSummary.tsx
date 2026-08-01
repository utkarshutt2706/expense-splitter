import { Link } from 'react-router';

import type { User } from '@data/entities';
import { CURRENT_USER_ID } from '@data/seed';
import { useExpenses } from '@features/expenses/hooks/useExpenses';
import { calculateNetBalance } from '@features/expenses/utils/calculateNetBalance';
import { Skeleton } from '@shared/components';

interface GroupBalanceSummaryProps {
    readonly groupId: string;
    readonly members: User[];
}

export function GroupBalanceSummary({ groupId, members }: GroupBalanceSummaryProps) {
    const { data: expenses, isLoading, isError } = useExpenses(groupId);

    if (isLoading) {
        return <Skeleton className="h-7 w-48" />;
    }

    if (isError) {
        return <p className="text-muted-foreground text-sm">Couldn't load balance.</p>;
    }

    const balance = calculateNetBalance(expenses ?? [], CURRENT_USER_ID);
    // members is briefly [] while useGroupMembers is still loading (this component's
    // own expenses query can resolve first) — members.every() on an empty array is
    // vacuously true, so guard against treating that transient state as "settled".
    const isGroupFullySettled =
        members.length > 0 &&
        members.every((member) => calculateNetBalance(expenses ?? [], member.id) === 0);

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
        <span className={`font-display text-lg font-medium ${className}`}>
            {text}
            {isGroupFullySettled ? (
                <span className="text-muted-foreground ml-2 text-base font-normal">
                    🎉 This group is all settled
                </span>
            ) : (
                <Link
                    to={`/groups/${groupId}/balance`}
                    className="text-muted-foreground hover:text-surface-foreground ml-2 text-base font-normal hover:underline"
                >
                    Click to view details
                </Link>
            )}
        </span>
    );
}
