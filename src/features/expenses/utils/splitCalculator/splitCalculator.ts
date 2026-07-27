import type { ExpenseSplit } from '@data/entities';

export class SplitCalculationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'SplitCalculationError';
    }
}

const PERCENTAGE_TOLERANCE = 0.01;

function toCents(amount: number): number {
    return Math.round(amount * 100);
}

// Largest-remainder method: after flooring each participant's proportional share,
// whoever's floor() truncated the most gets the leftover pennies first, so rounding
// doesn't systematically favor earlier participants in the list.
function allocateCents(totalCents: number, weights: number[]): number[] {
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    const rawCents = weights.map((weight) => (totalCents * weight) / totalWeight);
    const flooredCents = rawCents.map(Math.floor);

    let remainder = totalCents - flooredCents.reduce((sum, cents) => sum + cents, 0);

    const byFractionDesc = rawCents
        .map((cents, index) => ({ index, fraction: cents - Math.floor(cents) }))
        .sort((a, b) => b.fraction - a.fraction);

    const result = [...flooredCents];
    for (const { index } of byFractionDesc) {
        if (remainder <= 0) break;
        result[index]! += 1;
        remainder -= 1;
    }
    return result;
}

export interface EqualSplitInput {
    amount: number;
    participantUserIds: string[];
}

export function calculateEqualSplit({
    amount,
    participantUserIds,
}: EqualSplitInput): ExpenseSplit[] {
    if (participantUserIds.length === 0) {
        throw new SplitCalculationError('An equal split needs at least one participant');
    }

    const cents = allocateCents(
        toCents(amount),
        participantUserIds.map(() => 1),
    );

    return participantUserIds.map((userId, index) => ({
        userId,
        amount: cents[index]! / 100,
    }));
}

export interface ExactSplitEntry {
    userId: string;
    amount: number;
}

export interface ExactSplitInput {
    amount: number;
    splits: ExactSplitEntry[];
}

export function calculateExactSplit({ amount, splits }: ExactSplitInput): ExpenseSplit[] {
    if (splits.length === 0) {
        throw new SplitCalculationError('An exact split needs at least one participant');
    }

    const totalCents = toCents(amount);
    const splitCents = splits.map((split) => toCents(split.amount));
    const sumCents = splitCents.reduce((sum, cents) => sum + cents, 0);

    if (sumCents !== totalCents) {
        throw new SplitCalculationError(
            'Exact split amounts must add up to the total expense amount',
        );
    }

    return splits.map((split, index) => ({
        userId: split.userId,
        amount: splitCents[index]! / 100,
    }));
}

export interface PercentageSplitEntry {
    userId: string;
    percentage: number;
}

export interface PercentageSplitInput {
    amount: number;
    splits: PercentageSplitEntry[];
}

export function calculatePercentageSplit({ amount, splits }: PercentageSplitInput): ExpenseSplit[] {
    if (splits.length === 0) {
        throw new SplitCalculationError('A percentage split needs at least one participant');
    }

    const totalPercentage = splits.reduce((sum, split) => sum + split.percentage, 0);
    if (Math.abs(totalPercentage - 100) > PERCENTAGE_TOLERANCE) {
        throw new SplitCalculationError('Split percentages must add up to 100');
    }

    const cents = allocateCents(
        toCents(amount),
        splits.map((split) => split.percentage),
    );

    return splits.map((split, index) => ({
        userId: split.userId,
        amount: cents[index]! / 100,
    }));
}

export interface SharesSplitEntry {
    userId: string;
    shares: number;
}

export interface SharesSplitInput {
    amount: number;
    splits: SharesSplitEntry[];
}

export function calculateSharesSplit({ amount, splits }: SharesSplitInput): ExpenseSplit[] {
    if (splits.length === 0) {
        throw new SplitCalculationError('A shares split needs at least one participant');
    }

    if (splits.some((split) => split.shares <= 0)) {
        throw new SplitCalculationError('Shares must be greater than zero');
    }

    const cents = allocateCents(
        toCents(amount),
        splits.map((split) => split.shares),
    );

    return splits.map((split, index) => ({
        userId: split.userId,
        amount: cents[index]! / 100,
    }));
}
