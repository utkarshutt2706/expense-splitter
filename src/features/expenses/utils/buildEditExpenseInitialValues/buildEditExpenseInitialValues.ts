import type { Expense } from '@features/expenses/api/expensesApi';
import type { UpsertExpenseFormInitialValues } from '@features/expenses/components/UpsertExpenseForm';

export function buildEditExpenseInitialValues(expense: Expense): UpsertExpenseFormInitialValues {
    const splitValues: Record<string, string> = {};

    if (expense.splitType === 'exact') {
        for (const split of expense.splits) {
            splitValues[split.userId] = split.amount.toString();
        }
    } else if (expense.splitType === 'percentage') {
        for (const split of expense.splits) {
            splitValues[split.userId] = ((split.amount / expense.amount) * 100).toFixed(2);
        }
    }
    // Shares are left blank: only the resulting dollar amounts are persisted, not the
    // original share counts, and share counts aren't recoverable from amounts alone
    // (e.g. 2:1 and 4:2 produce identical splits) — editing a shares split means
    // re-entering shares.

    return {
        description: expense.description,
        amount: expense.amount,
        paidByUserId: expense.paidByUserId,
        paidOn: expense.paidOn ?? expense.createdAt,
        participantUserIds: expense.splits.map((split) => split.userId),
        splitType: expense.splitType,
        splitValues,
    };
}
