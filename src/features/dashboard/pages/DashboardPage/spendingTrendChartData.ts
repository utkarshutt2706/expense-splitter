interface ChartPoint {
    period: string;
    label: string;
    amount: number;
    actualPaid: number;
    currentUserShare: number;
}

function adjacentPeriod(period: string, granularity: 'day' | 'month', offset: -1 | 1): string {
    const date = new Date(granularity === 'day' ? `${period}T00:00:00Z` : `${period}-01T00:00:00Z`);

    if (granularity === 'day') date.setUTCDate(date.getUTCDate() + offset);
    else date.setUTCMonth(date.getUTCMonth() + offset);

    return date.toISOString().slice(0, granularity === 'day' ? 10 : 7);
}

export function addSingletonEndpoints<T extends ChartPoint>(
    chartData: T[],
    granularity: 'day' | 'month',
    labelPeriod: (period: string) => string,
): T[] {
    if (chartData.length !== 1) return chartData;

    return ([-1, 0, 1] as const).map((offset) => {
        if (offset === 0) return chartData[0]!;
        const period = adjacentPeriod(chartData[0]!.period, granularity, offset);
        return {
            ...chartData[0]!,
            period,
            label: labelPeriod(period),
            amount: 0,
            actualPaid: 0,
            currentUserShare: 0,
        };
    });
}
