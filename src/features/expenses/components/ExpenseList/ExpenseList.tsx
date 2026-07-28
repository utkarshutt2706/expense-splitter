import type { User } from '@data/entities';
import { CURRENT_USER_ID } from '@data/seed';
import { useExpenses } from '@features/expenses/hooks/useExpenses';
import { Avatar } from '@shared/components';
import { SkeletonList } from '@shared/components/SkeletonList';

interface ExpenseListProps {
    readonly groupId: string;
    readonly members: User[];
}

const dateFormatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
});

function payerLabel(payer: User | undefined): string {
    if (!payer) return 'Someone';
    return payer.id === CURRENT_USER_ID ? 'You' : payer.name;
}

export function ExpenseList({ groupId, members }: ExpenseListProps) {
    const { data: expenses, isLoading, isError } = useExpenses(groupId);

    if (isLoading) {
        return <SkeletonList label="Loading expenses…" />;
    }

    if (isError) {
        return <div className="text-red-600">Couldn't load expenses.</div>;
    }

    if (!expenses || expenses.length === 0) {
        return <div className="text-muted-foreground">No expenses yet.</div>;
    }

    const membersById = new Map(members.map((member) => [member.id, member]));

    return (
        <ul className="flex flex-col gap-3">
            {expenses.map((expense) => {
                const payer = membersById.get(expense.paidByUserId);

                return (
                    <li
                        key={expense.id}
                        className="flex items-center gap-3 rounded-lg border border-border p-3"
                    >
                        <Avatar name={payer?.name ?? '?'} />
                        <div className="flex-1">
                            <p className="font-medium text-surface-foreground">
                                {expense.description}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {payerLabel(payer)} paid ·{' '}
                                {dateFormatter.format(new Date(expense.createdAt))}
                            </p>
                        </div>
                        <p className="font-medium text-surface-foreground">
                            ₹{expense.amount.toFixed(2)}
                        </p>
                    </li>
                );
            })}
        </ul>
    );
}
