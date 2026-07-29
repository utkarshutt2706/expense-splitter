import type { ExpenseSplit, SplitType } from '@data/entities';
import {
    calculateEqualSplit,
    calculateExactSplit,
    calculatePercentageSplit,
    calculateSharesSplit,
    type ExactSplitEntry,
    type PercentageSplitEntry,
    type SharesSplitEntry,
} from '../splitCalculator';

export interface ResolveSplitsInput {
    splitType: SplitType;
    amount: number;
    participantUserIds: string[];
    exactSplits?: ExactSplitEntry[];
    percentageSplits?: PercentageSplitEntry[];
    sharesSplits?: SharesSplitEntry[];
}

export function resolveSplits({
    splitType,
    amount,
    participantUserIds,
    exactSplits,
    percentageSplits,
    sharesSplits,
}: ResolveSplitsInput): ExpenseSplit[] {
    if (splitType === 'exact' && exactSplits) {
        return calculateExactSplit({ amount, splits: exactSplits });
    }
    if (splitType === 'percentage' && percentageSplits) {
        return calculatePercentageSplit({ amount, splits: percentageSplits });
    }
    if (splitType === 'shares' && sharesSplits) {
        return calculateSharesSplit({ amount, splits: sharesSplits });
    }
    return calculateEqualSplit({ amount, participantUserIds });
}
