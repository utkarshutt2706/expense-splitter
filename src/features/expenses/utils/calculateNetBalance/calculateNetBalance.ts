import type { Expense } from '@data/entities';

function toCents(amount: number): number {
    return Math.round(amount * 100);
}

// A plain net total across every expense in the group — not the simplified
// who-owes-whom breakdown (that's the future balance page's job, backed by the
// Simplify Debt algorithm). Positive means the user is owed money overall,
// negative means the user owes money overall, zero means settled.
export function calculateNetBalance(expenses: Expense[], userId: string): number {
    const netCents = expenses.reduce((balanceCents, expense) => {
        if (expense.paidByUserId === userId) {
            const othersOwedCents = expense.splits.reduce(
                (sum, split) => (split.userId === userId ? sum : sum + toCents(split.amount)),
                0,
            );
            return balanceCents + othersOwedCents;
        }

        const ownSplit = expense.splits.find((split) => split.userId === userId);
        return ownSplit ? balanceCents - toCents(ownSplit.amount) : balanceCents;
    }, 0);

    return netCents / 100;
}
