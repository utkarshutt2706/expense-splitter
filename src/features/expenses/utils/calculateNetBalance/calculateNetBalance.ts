import type { Expense, Payment } from '@data/entities';

function toCents(amount: number): number {
    return Math.round(amount * 100);
}

// A plain net total across every expense and payment in the group — not the
// simplified who-owes-whom breakdown (that's the balance page's job, backed by
// the Simplify Debt algorithm). Positive means the user is owed money overall,
// negative means the user owes money overall, zero means settled.
export function calculateNetBalance(
    expenses: Expense[],
    payments: Payment[],
    userId: string,
): number {
    const expenseCents = expenses.reduce((balanceCents, expense) => {
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

    // A payment cancels part of a debt: the sender's balance moves toward
    // positive (they've paid down what they owed), the recipient's moves
    // toward negative (what was owed to them has now been settled) — the exact
    // inverse of an expense where the recipient paid and the sender owed.
    const paymentCents = payments.reduce((balanceCents, payment) => {
        if (payment.fromUserId === userId) {
            return balanceCents + toCents(payment.amount);
        }
        if (payment.toUserId === userId) {
            return balanceCents - toCents(payment.amount);
        }
        return balanceCents;
    }, 0);

    return (expenseCents + paymentCents) / 100;
}
