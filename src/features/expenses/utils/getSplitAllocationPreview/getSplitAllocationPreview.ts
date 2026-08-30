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

function equalPreview(amount: number, participantUserIds: string[]): SplitAllocationPreview {
    const splits = calculateEqualSplit({ amount, participantUserIds });
    const counts = new Map<number, number>();
    for (const split of splits) {
        const cents = Math.round(split.amount * 100);
        counts.set(cents, (counts.get(cents) ?? 0) + 1);
    }

    const participantCount = participantUserIds.length;
    const participantLabel = participantCount === 1 ? 'participant' : 'participants';
    const allocations = [...counts.entries()].sort(([a], [b]) => a - b);
    let summary = `${participantCount} ${participantLabel} · ${formatAmount(allocations[0]![0] / 100)} each`;
    if (allocations.length > 1) {
        summary = allocations
            .map(([cents, count]) => {
                const recipientLabel =
                    count === 1 ? 'participant receives' : 'participants receive';
                return `${count} ${recipientLabel} ${formatAmount(cents / 100)}`;
            })
            .join(' · ');
    }
    return { summary, status: 'valid', resolvedAmounts: amountsByUser(splits) };
}

function exactPreview(amount: number, values: number[]): SplitAllocationPreview {
    const assignedCents = values.reduce((sum, value) => sum + Math.round(value * 100), 0);
    const differenceCents = Math.round(amount * 100) - assignedCents;
    let differenceText = 'Matches the expense total';
    if (differenceCents > 0) {
        differenceText = `${formatAmount(differenceCents / 100)} remaining`;
    } else if (differenceCents < 0) {
        differenceText = `${formatAmount(Math.abs(differenceCents) / 100)} over the expense total`;
    }

    let status: SplitAllocationPreview['status'] = 'neutral';
    if (differenceCents === 0) status = 'valid';
    if (differenceCents < 0) status = 'invalid';
    return {
        summary: `${formatAmount(assignedCents / 100)} assigned · ${differenceText}`,
        status,
        resolvedAmounts: {},
    };
}

function percentagePreview(
    amount: number,
    participantUserIds: string[],
    values: number[],
): SplitAllocationPreview {
    const assigned = values.reduce((sum, value) => sum + value, 0);
    const difference = 100 - assigned;
    const isComplete = Math.abs(difference) <= PERCENTAGE_TOLERANCE;
    let differenceText = '';
    if (!isComplete && difference > 0) {
        differenceText = ` · ${formatNumber(difference)}% remaining`;
    } else if (!isComplete) {
        differenceText = ` · ${formatNumber(Math.abs(difference))}% over`;
    }
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
    let status: SplitAllocationPreview['status'] = 'neutral';
    if (canResolve) status = 'valid';
    if (difference < 0) status = 'invalid';
    return {
        summary: `${formatNumber(assigned)}% assigned${differenceText}`,
        status,
        resolvedAmounts: amountsByUser(splits),
    };
}

function sharesPreview(
    amount: number,
    participantUserIds: string[],
    values: number[],
): SplitAllocationPreview {
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
    const label = totalShares === 1 ? 'share' : 'shares';
    const prompt = canResolve ? '' : ' · Enter a positive share for every participant';
    return {
        summary: `${formatNumber(totalShares)} ${label} in total${prompt}`,
        status: canResolve ? 'valid' : 'neutral',
        resolvedAmounts: amountsByUser(splits),
    };
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
        return equalPreview(amount, participantUserIds);
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
        return exactPreview(amount, values);
    }

    if (splitType === 'percentage') {
        return percentagePreview(amount, participantUserIds, values);
    }
    return sharesPreview(amount, participantUserIds, values);
}
