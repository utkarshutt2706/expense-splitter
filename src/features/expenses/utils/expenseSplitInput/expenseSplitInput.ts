import type { SplitType } from '@features/expenses/api/expensesApi';

const PERCENTAGE_TOLERANCE = 0.01;

export type ParsedSplitValue = { userId: string; value: number };

export function validateSplitInput(
    splitType: SplitType,
    amount: number,
    participantUserIds: string[],
    splitValues: Readonly<Record<string, string>>,
): { values?: ParsedSplitValue[]; error?: string } {
    if (splitType === 'equal') return {};
    const label =
        splitType === 'exact'
            ? 'an amount'
            : splitType === 'percentage'
              ? 'a percentage'
              : 'a share count';
    const values = participantUserIds.map((userId) => ({
        userId,
        value: Number(splitValues[userId] ?? Number.NaN),
    }));
    if (values.some((entry) => !Number.isFinite(entry.value) || entry.value <= 0)) {
        return { error: `Enter ${label} for every participant` };
    }
    if (
        splitType === 'exact' &&
        values.reduce((sum, entry) => sum + Math.round(entry.value * 100), 0) !==
            Math.round(amount * 100)
    ) {
        return { error: 'Exact amounts must add up to the total expense amount' };
    }
    if (
        splitType === 'percentage' &&
        Math.abs(values.reduce((sum, entry) => sum + entry.value, 0) - 100) > PERCENTAGE_TOLERANCE
    ) {
        return { error: 'Split percentages must add up to 100' };
    }
    return { values };
}
