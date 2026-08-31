import { formatCurrency } from '@shared/utils';

export function contributionBalanceLabel(owed: number, owe: number): string {
    if (owed > 0) return `You are owed ${formatCurrency(owed)}`;
    if (owe > 0) return `You owe ${formatCurrency(owe)}`;
    return 'Level with your share';
}
