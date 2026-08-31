import { useState } from 'react';

import type {
    DashboardDailySpend,
    DashboardMonthlySpend,
} from '@features/dashboard/api/dashboardApi';
import { PeriodSelector, type TrendEntry } from '@features/dashboard/components/PeriodSelector';
import { TrendSummary } from '@features/dashboard/components/TrendSummary';
import { UnavailableTrend } from '@features/dashboard/components/UnavailableTrend';

function monthLabel(month: string): string {
    return new Intl.DateTimeFormat('en-IN', {
        month: 'short',
        year: '2-digit',
        timeZone: 'UTC',
    }).format(new Date(`${month}-01T00:00:00Z`));
}

function dayLabel(date: string): string {
    return new Intl.DateTimeFormat('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
    }).format(new Date(`${date}T00:00:00Z`));
}

export type SpendingTrendChartProps = Readonly<
    | { data?: DashboardDailySpend[]; granularity: 'day' }
    | { data: DashboardMonthlySpend[]; granularity: 'month' }
>;

function getPeriod(entry: DashboardDailySpend | DashboardMonthlySpend): string {
    return 'date' in entry ? entry.date : entry.month;
}

function getPeriodLabel(period: string, granularity: 'day' | 'month'): string {
    return granularity === 'day' ? dayLabel(period) : monthLabel(period);
}

function buildChartData(
    data: DashboardDailySpend[] | DashboardMonthlySpend[],
    granularity: 'day' | 'month',
): TrendEntry[] {
    return data.map((entry) => {
        const period = getPeriod(entry);
        return {
            period,
            label: getPeriodLabel(period, granularity),
            amount: entry.amount,
            currentUserShare: entry.currentUserShare,
            actualPaid: entry.actualPaid,
        };
    });
}

export function SpendingTrendChart({ data, granularity }: SpendingTrendChartProps) {
    const [selectedPeriod, setSelectedPeriod] = useState('');
    const [periodPopoverOpen, setPeriodPopoverOpen] = useState(false);

    if (data === undefined) return <UnavailableTrend />;
    if (data.length === 0) return null;

    const chartData = buildChartData(data, granularity);
    const selected =
        chartData.find((entry) => entry.period === selectedPeriod) ?? chartData.at(-1)!;
    const periodName = granularity === 'day' ? 'Daily' : 'Monthly';

    return (
        <section
            aria-labelledby="trend-heading"
            className="border-border bg-surface flex flex-col gap-3 rounded-2xl border p-5 md:p-6"
        >
            <div className="flex flex-col items-start justify-between gap-3 md:flex-row">
                <div className="flex flex-col items-start justify-between">
                    <h2 id="trend-heading" className="text-2xl font-semibold">
                        Spending over time
                    </h2>
                    <p className="text-muted-foreground mt-1 text-sm">
                        {periodName} recorded expenses. Settlement payments are excluded.
                    </p>
                </div>
                <PeriodSelector
                    entries={chartData}
                    selectedPeriod={selectedPeriod}
                    open={periodPopoverOpen}
                    onOpenChange={setPeriodPopoverOpen}
                    onSelect={setSelectedPeriod}
                />
            </div>
            <TrendSummary selected={selected} />
        </section>
    );
}
