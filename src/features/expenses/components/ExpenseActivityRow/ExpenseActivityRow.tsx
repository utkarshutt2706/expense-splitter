import { Pencil, Trash2 } from 'lucide-react';
import { Link } from 'react-router';

import type { Expense } from '@features/expenses/api/expensesApi';
import { calculateExpenseInvolvement } from '@features/expenses/utils/calculateExpenseInvolvement';
import type { User } from '@features/users/api/usersApi';
import { Avatar, SwipeableRow } from '@shared/components';
import { formatCurrency } from '@shared/utils';

const dateFormatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
});

function memberLabel(member: User | undefined, names: Map<string, string>): string {
    if (!member) return 'Someone';
    return names.get(member.id) ?? member.name;
}

function involvementLabel(
    expense: Expense,
    currentUserId: string | undefined,
): { text: string; className: string } {
    const involvement = calculateExpenseInvolvement(expense, currentUserId ?? '');

    if (involvement.type === 'lent') {
        return { text: `You lent ${formatCurrency(involvement.amount)}`, className: 'text-owed' };
    }

    if (involvement.type === 'owed') {
        return { text: `You owe ${formatCurrency(involvement.amount)}`, className: 'text-owe' };
    }

    return { text: 'You were not involved', className: 'text-muted-foreground' };
}

export type ExpenseActivityRowProps = Readonly<{
    groupId: string;
    expense: Expense;
    membersById: Map<string, User>;
    names: Map<string, string>;
    currentUserId?: string;
    onEdit: () => void;
    onDelete: () => void;
}>;

export function ExpenseActivityRow({
    groupId,
    expense,
    membersById,
    names,
    currentUserId,
    onEdit,
    onDelete,
}: ExpenseActivityRowProps) {
    const payer = membersById.get(expense.paidByUserId);
    const involvement = involvementLabel(expense, currentUserId);

    return (
        <SwipeableRow
            actions={[
                { key: 'edit', label: 'Edit', icon: Pencil, onClick: onEdit },
                {
                    key: 'delete',
                    label: 'Delete',
                    icon: Trash2,
                    tone: 'destructive',
                    onClick: onDelete,
                },
            ]}
        >
            <Link
                to={`/groups/${groupId}/expenses/${expense.id}`}
                className="border-border hover:bg-muted flex items-center gap-3 rounded-lg border p-3"
            >
                <Avatar name={payer?.name ?? '?'} />
                <div className="min-w-0 flex-1">
                    <p className="text-surface-foreground font-medium">{expense.description}</p>
                    <p className="text-muted-foreground text-sm">
                        {memberLabel(payer, names)} paid ·{' '}
                        {dateFormatter.format(new Date(expense.paidOn ?? expense.createdAt))}
                    </p>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                    <p className="text-surface-foreground font-medium">
                        {formatCurrency(expense.amount)}
                    </p>
                    <p className={`text-xs ${involvement.className}`}>{involvement.text}</p>
                </div>
            </Link>
        </SwipeableRow>
    );
}
