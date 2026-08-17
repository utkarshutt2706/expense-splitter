const money = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

export function formatMoney(value: number): string {
    return money.format(Math.abs(value));
}

export function contributionCopy(paid: number, share: number): string {
    const difference = Math.round((paid - share) * 100) / 100;
    if (difference > 0)
        return `You paid ${formatMoney(difference)} more than your share before settlements.`;
    if (difference < 0)
        return `You paid ${formatMoney(difference)} less than your share before settlements.`;
    return 'What you paid matches your share before settlements.';
}

export function comparisonScale(paid: number, share: number): number {
    return Math.max(paid, share, 1);
}

export function combineMonthlySpending(groups: DashboardGroupSpend[]): DashboardMonthlySpend[] {
    const months = new Map<
        string,
        { amount: number; actualPaid: number; currentUserShare: number }
    >();
    for (const group of groups) {
        for (const entry of group.spendingByMonth) {
            const current = months.get(entry.month) ?? {
                amount: 0,
                actualPaid: 0,
                currentUserShare: 0,
            };
            current.amount = Math.round((current.amount + entry.amount) * 100) / 100;
            current.actualPaid = Math.round((current.actualPaid + entry.actualPaid) * 100) / 100;
            current.currentUserShare =
                Math.round((current.currentUserShare + entry.currentUserShare) * 100) / 100;
            months.set(entry.month, current);
        }
    }
    return [...months.entries()]
        .map(([month, values]) => ({ month, ...values }))
        .sort((left, right) => left.month.localeCompare(right.month));
}

export function combineDailySpending(groups: DashboardGroupSpend[]): DashboardDailySpend[] {
    const days = new Map<
        string,
        { amount: number; actualPaid: number; currentUserShare: number }
    >();
    for (const group of groups) {
        for (const entry of group.spendingByDay ?? []) {
            const current = days.get(entry.date) ?? {
                amount: 0,
                actualPaid: 0,
                currentUserShare: 0,
            };
            current.amount = Math.round((current.amount + entry.amount) * 100) / 100;
            current.actualPaid = Math.round((current.actualPaid + entry.actualPaid) * 100) / 100;
            current.currentUserShare =
                Math.round((current.currentUserShare + entry.currentUserShare) * 100) / 100;
            days.set(entry.date, current);
        }
    }
    return [...days.entries()]
        .map(([date, values]) => ({ date, ...values }))
        .sort((left, right) => left.date.localeCompare(right.date));
}
import type {
    DashboardDailySpend,
    DashboardGroupSpend,
    DashboardMonthlySpend,
} from '@features/dashboard/api/dashboardApi';
