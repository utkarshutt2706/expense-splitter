import type { Expense } from '@features/expenses/api/expensesApi';

export type ExpenseInvolvement =
    { type: 'lent'; amount: number } | { type: 'owed'; amount: number } | { type: 'uninvolved' };

function toCents(amount: number): number {
    return Math.round(amount * 100);
}

// The current user's relationship to a single expense — distinct from a group's
// overall balance, which the backend derives across every expense and payment
// (see @features/balances/api/balancesApi).
export function calculateExpenseInvolvement(expense: Expense, userId: string): ExpenseInvolvement {
    if (expense.paidByUserId === userId) {
        const lentCents = expense.splits.reduce(
            (sum, split) => (split.userId === userId ? sum : sum + toCents(split.amount)),
            0,
        );
        return { type: 'lent', amount: lentCents / 100 };
    }

    const ownSplit = expense.splits.find((split) => split.userId === userId);
    if (ownSplit) {
        return { type: 'owed', amount: ownSplit.amount };
    }

    return { type: 'uninvolved' };
}
