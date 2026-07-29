import { Link } from 'react-router';

import { CURRENT_USER_ID } from '@data/seed';
import { useExpenses } from '@features/expenses/hooks/useExpenses';
import { calculateNetBalance } from '@features/expenses/utils/calculateNetBalance';
import { Skeleton } from '@shared/components';

interface GroupBalanceSummaryProps {
    readonly groupId: string;
}

export function GroupBalanceSummary({ groupId }: GroupBalanceSummaryProps) {
    const { data: expenses, isLoading, isError } = useExpenses(groupId);

    if (isLoading) {
        return <Skeleton className="h-7 w-48" />;
    }

    if (isError) {
        return <p className="text-sm text-muted-foreground">Couldn't load balance.</p>;
    }

    const balance = calculateNetBalance(expenses ?? [], CURRENT_USER_ID);

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
            <Link
                to={`/groups/${groupId}/balance`}
                className="ml-2 text-base font-normal text-muted-foreground hover:text-surface-foreground hover:underline"
            >
                Click to view details
            </Link>
        </span>
    );
}
