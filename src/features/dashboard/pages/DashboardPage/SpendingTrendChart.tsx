import * as Popover from '@radix-ui/react-popover';
import { Check, ChevronDown } from 'lucide-react';
import { useState } from 'react';

import type {
    DashboardDailySpend,
    DashboardMonthlySpend,
} from '@features/dashboard/api/dashboardApi';
import { ResponsivePopoverContent } from '@shared/components';
import { formatCurrency } from '@shared/utils';

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

type SpendingTrendChartProps = Readonly<
    | { data?: DashboardDailySpend[]; granularity: 'day' }
    | { data: DashboardMonthlySpend[]; granularity: 'month' }
>;

type TrendEntry = {
    period: string;
    label: string;
    amount: number;
    currentUserShare: number;
    actualPaid: number;
};

const SUMMARY_LABELS = [
    ['Total group spending', 'amount'],
    ['Your share', 'currentUserShare'],
    ['Paid by you', 'actualPaid'],
] as const;

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

function UnavailableTrend() {
    return (
        <section className="border-border bg-muted/40 rounded-2xl border p-5 md:p-6">
            <h2 className="text-xl font-semibold">Daily trend unavailable</h2>

            <p className="text-muted-foreground mt-1 text-sm">
                Refresh after the dashboard server has been updated.
            </p>
        </section>
    );
}

function PeriodSelector({
    entries,
    selectedPeriod,
    open,
    onOpenChange,
    onSelect,
}: Readonly<{
    entries: TrendEntry[];
    selectedPeriod: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect: (period: string) => void;
}>) {
    const selected = entries.find((entry) => entry.period === selectedPeriod) ?? entries.at(-1)!;

    return (
        <Popover.Root open={open} onOpenChange={onOpenChange}>
            <Popover.Trigger asChild>
                <button
                    type="button"
                    aria-labelledby="dashboard-chart-period-label dashboard-chart-period-value"
                    aria-haspopup="listbox"
                    aria-expanded={open}
                    className="border-border bg-surface focus-visible:ring-brand-500 flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-md border px-3 text-left outline-none focus-visible:ring-2 md:w-fit"
                >
                    <span id="dashboard-chart-period-value" className="truncate">
                        {selected.label}
                    </span>

                    <ChevronDown
                        aria-hidden="true"
                        className={`text-muted-foreground size-4 shrink-0 transition-transform ${
                            open ? 'rotate-180' : ''
                        }`}
                    />
                </button>
            </Popover.Trigger>

            <Popover.Portal>
                <ResponsivePopoverContent
                    align="start"
                    sideOffset={8}
                    role="listbox"
                    aria-label="Choose chart date"
                    className="border-border bg-surface z-50 w-[var(--radix-popover-trigger-width)] rounded-lg border p-2 shadow-lg"
                >
                    <div className="max-h-64 overflow-y-auto">
                        {entries.map((entry) => {
                            const isSelected = entry.period === selected.period;

                            return (
                                <button
                                    key={entry.period}
                                    type="button"
                                    role="option"
                                    aria-selected={isSelected}
                                    onClick={() => {
                                        onSelect(entry.period);
                                        onOpenChange(false);
                                    }}
                                    className="hover:bg-muted focus-visible:bg-muted flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-md px-2 text-left outline-none"
                                >
                                    <span className="truncate">{entry.label}</span>

                                    {isSelected && (
                                        <Check
                                            aria-hidden="true"
                                            className="text-brand-600 size-4 shrink-0"
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </ResponsivePopoverContent>
            </Popover.Portal>
        </Popover.Root>
    );
}

function TrendSummary({
    selected,
}: Readonly<{
    selected: TrendEntry;
}>) {
    return (
        <dl className="w-full space-y-2 text-sm" aria-live="polite">
            {SUMMARY_LABELS.map(([label, key]) => (
                <div key={key} className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">{label}</dt>

                    <dd className="shrink-0 font-semibold">{formatCurrency(selected[key])}</dd>
                </div>
            ))}
        </dl>
    );
}

export function SpendingTrendChart({ data, granularity }: SpendingTrendChartProps) {
    const [selectedPeriod, setSelectedPeriod] = useState('');
    const [periodPopoverOpen, setPeriodPopoverOpen] = useState(false);

    if (data === undefined) {
        return <UnavailableTrend />;
    }

    if (data.length === 0) {
        return null;
    }

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
