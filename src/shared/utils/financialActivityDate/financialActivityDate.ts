interface FinancialActivityDate {
    paidOn?: string;
    createdAt: string;
}

export function compareFinancialActivityNewestFirst(
    left: FinancialActivityDate,
    right: FinancialActivityDate,
): number {
    const paidOnDifference =
        new Date(right.paidOn ?? right.createdAt).getTime() -
        new Date(left.paidOn ?? left.createdAt).getTime();

    if (paidOnDifference !== 0) return paidOnDifference;

    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
}
