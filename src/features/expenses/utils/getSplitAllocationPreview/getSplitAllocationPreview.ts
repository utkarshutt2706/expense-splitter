import type { SplitType } from '@data/entities';
import { formatCurrency } from '@shared/utils';
import {
    calculateEqualSplit,
    calculatePercentageSplit,
    calculateSharesSplit,
} from '../splitCalculator';

const PERCENTAGE_TOLERANCE = 0.01;

function formatAmount(value: number): string {
    return formatCurrency(value);
}

function formatNumber(value: number): string {
    return Number(value.toFixed(2)).toString();
}

function enteredValues(ids: string[], values: Record<string, string>): number[] {
    return ids.map((id) => {
        const raw = values[id];
        return raw === undefined || raw === '' ? 0 : Number(raw);
    });
}

function amountsByUser(splits: { userId: string; amount: number }[]): Record<string, number> {
    return Object.fromEntries(splits.map((split) => [split.userId, split.amount]));
}

export interface SplitAllocationPreview {
    summary: string;
    status: 'neutral' | 'valid' | 'invalid';
    resolvedAmounts: Record<string, number>;
}

interface SplitAllocationPreviewInput {
    amount: number | undefined;
    participantUserIds: string[];
    splitType: SplitType;
    splitValues: Record<string, string>;
}

export function getSplitAllocationPreview({
    amount,
    participantUserIds,
    splitType,
    splitValues,
}: SplitAllocationPreviewInput): SplitAllocationPreview {
    if (participantUserIds.length === 0) {
        return {
            summary: 'Select at least one participant.',
            status: 'invalid',
            resolvedAmounts: {},
        };
    }

    const hasValidAmount = typeof amount === 'number' && Number.isFinite(amount) && amount > 0;
    if (!hasValidAmount) {
        return {
            summary: 'Enter a valid expense amount to preview the allocation.',
            status: 'neutral',
            resolvedAmounts: {},
        };
    }

    if (splitType === 'equal') {
        const splits = calculateEqualSplit({ amount, participantUserIds });
        const counts = new Map<number, number>();
        for (const split of splits) {
            const cents = Math.round(split.amount * 100);
            counts.set(cents, (counts.get(cents) ?? 0) + 1);
        }

        const participantCount = participantUserIds.length;
        const participantLabel = participantCount === 1 ? 'participant' : 'participants';
        const allocations = [...counts.entries()].sort(([a], [b]) => a - b);
        const summary =
            allocations.length === 1
                ? `${participantCount} ${participantLabel} · ${formatAmount(allocations[0]![0] / 100)} each`
                : allocations
                      .map(
                          ([cents, count]) =>
                              `${count} ${count === 1 ? 'participant receives' : 'participants receive'} ${formatAmount(cents / 100)}`,
                      )
                      .join(' · ');

        return { summary, status: 'valid', resolvedAmounts: amountsByUser(splits) };
    }

    const values = enteredValues(participantUserIds, splitValues);
    if (values.some((value) => !Number.isFinite(value) || value < 0)) {
        return {
            summary: 'Enter valid, non-negative allocation values.',
            status: 'invalid',
            resolvedAmounts: {},
        };
    }

    if (splitType === 'exact') {
        const assignedCents = values.reduce((sum, value) => sum + Math.round(value * 100), 0);
        const totalCents = Math.round(amount * 100);
        const differenceCents = totalCents - assignedCents;
        const differenceText =
            differenceCents === 0
                ? 'Matches the expense total'
                : differenceCents > 0
                  ? `${formatAmount(differenceCents / 100)} remaining`
                  : `${formatAmount(Math.abs(differenceCents) / 100)} over the expense total`;

        return {
            summary: `${formatAmount(assignedCents / 100)} assigned · ${differenceText}`,
            status: differenceCents === 0 ? 'valid' : differenceCents < 0 ? 'invalid' : 'neutral',
            resolvedAmounts: {},
        };
    }

    if (splitType === 'percentage') {
        const assigned = values.reduce((sum, value) => sum + value, 0);
        const difference = 100 - assigned;
        const isComplete = Math.abs(difference) <= PERCENTAGE_TOLERANCE;
        const differenceText = isComplete
            ? ''
            : difference > 0
              ? ` · ${formatNumber(difference)}% remaining`
              : ` · ${formatNumber(Math.abs(difference))}% over`;
        const canResolve = isComplete && values.every((value) => value > 0);
        const splits = canResolve
            ? calculatePercentageSplit({
                  amount,
                  splits: participantUserIds.map((userId, index) => ({
                      userId,
                      percentage: values[index]!,
                  })),
              })
            : [];

        return {
            summary: `${formatNumber(assigned)}% assigned${differenceText}`,
            status: isComplete && canResolve ? 'valid' : difference < 0 ? 'invalid' : 'neutral',
            resolvedAmounts: amountsByUser(splits),
        };
    }

    const totalShares = values.reduce((sum, value) => sum + value, 0);
    const canResolve = totalShares > 0 && values.every((value) => value > 0);
    const splits = canResolve
        ? calculateSharesSplit({
              amount,
              splits: participantUserIds.map((userId, index) => ({
                  userId,
                  shares: values[index]!,
              })),
          })
        : [];

    return {
        summary: `${formatNumber(totalShares)} ${totalShares === 1 ? 'share' : 'shares'} in total${canResolve ? '' : ' · Enter a positive share for every participant'}`,
        status: canResolve ? 'valid' : 'neutral',
        resolvedAmounts: amountsByUser(splits),
    };
}
