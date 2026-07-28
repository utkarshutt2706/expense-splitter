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

    if (balance > 0) {
        return (
            <p className="font-display text-lg font-medium text-owed">
                You are owed ₹{balance.toFixed(2)}
            </p>
        );
    }

    if (balance < 0) {
        return (
            <p className="font-display text-lg font-medium text-owe">
                You owe ₹{Math.abs(balance).toFixed(2)}
            </p>
        );
    }

    return <p className="font-display text-lg font-medium text-settled">You're all settled up</p>;
}
