import { BarChart3, BarChartHorizontal, LineChart, PieChart, TrendingUp } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart as RechartsPieChart,
    ReferenceLine,
    ResponsiveContainer,
    Sector,
    Tooltip,
    XAxis,
    YAxis,
    type PieSectorShapeProps,
} from 'recharts';

import type { DashboardGroupSpend } from '@features/dashboard/api/dashboardApi';
import { useDashboard } from '@features/dashboard/hooks';
import {
    disambiguateParticipantNames,
    formatCompactCurrency,
    formatCurrency,
    sortMembersByName,
} from '@shared/utils';
import {
    presetPeriod,
    usesDailyTrend,
    type DashboardPeriod,
} from '../DashboardPage/dashboardDateRange';
import { combineDailySpending, combineMonthlySpending } from '../DashboardPage/dashboardMetrics';
import { DashboardTimeFilter } from '../DashboardPage/DashboardTimeFilter';
import { GroupScopeSelector } from '../DashboardPage/GroupScopeSelector';
import { monthLabel, shortDayLabel } from '../DashboardPage/periodLabels';
import { SpendingTrendGraph } from '../DashboardPage/SpendingTrendGraph';
import {
    bucketGroupSpending,
    contributionBalance,
    cumulativeNetPosition,
    niceTicks,
} from './analyticsMetrics';

const COLORS = [
    'var(--color-brand-600)',
    'var(--color-sky-500)',
    'var(--color-emerald-500)',
    'var(--color-rose-500)',
    'var(--color-violet-500)',
    'var(--color-amber-500)',
    'var(--color-teal-500)',
    'var(--color-fuchsia-500)',
    'var(--color-lime-600)',
    'var(--color-slate-500)',
];

const CHART_MARGIN = {
    top: 8,
    right: 8,
    bottom: 8,
    left: 8,
};

const CHART_TOOLTIP_STYLE = {
    background: 'var(--surface)',
    border: '1px solid var(--border-color)',
    borderRadius: '0.75rem',
    color: 'var(--surface-foreground)',
};

const CHART_TICK = {
    fill: 'var(--muted-foreground)',
    fontSize: 12,
};

const BAR_RADIUS: [number, number, number, number] = [5, 5, 0, 0];

// Enough for a bucket label ("10 Aug", "Aug 26") plus breathing room. Once the
// buckets no longer fit, the plot keeps this width each and the frame scrolls,
// rather than compressing bars until the axis is unreadable.
const MIN_CATEGORY_WIDTH = 56;

// A cluster also has to fit one legible bar per group, which overtakes the
// label width from about three groups up.
const MIN_BAR_WIDTH = 20;

// Recharts lays a cartesian plot out as margin.top .. height - margin.bottom -
// xAxisHeight. Pinning these means the pinned axis can place its labels at the
// same rows the plot draws its gridlines on. Pixels, not rem: the root font
// size changes at 1024px, which would otherwise move the plot but not the
// labels.
const PLOT_HEIGHT = 288;
const X_AXIS_HEIGHT = 30;
const VALUE_AXIS_WIDTH = 58;

function ChartFrame({
    title,
    description,
    icon: Icon,
    children,
}: Readonly<{
    title: string;
    description: string;
    icon: typeof LineChart;
    children: ReactNode;
}>) {
    return (
        <section
            aria-labelledby={`${title}-heading`}
            className="border-border bg-surface min-w-0 rounded-2xl border p-5 md:p-6"
        >
            <div className="flex items-start gap-3">
                <span className="bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300 flex size-10 shrink-0 items-center justify-center rounded-lg">
                    <Icon aria-hidden="true" className="size-5" />
                </span>

                <div>
                    <h2 id={`${title}-heading`} className="text-xl font-semibold">
                        {title}
                    </h2>

                    <p className="text-muted-foreground mt-1 text-sm">{description}</p>
                </div>
            </div>

            {children}
        </section>
    );
}

/**
 * Keeps a categorical chart legible however many groups it holds: the plot
 * claims at least MIN_CATEGORY_WIDTH per group and this frame scrolls when that
 * exceeds the space available. The chart's accessible table carries the same
 * numbers, so nothing is only reachable by scrolling.
 */
function ScrollableChart({
    categories,
    perCategory = MIN_CATEGORY_WIDTH,
    label,
    ticks,
    legend,
    children,
}: Readonly<{
    categories: number;
    perCategory?: number;
    label: string;
    ticks: number[];
    legend: readonly { name: string; fill: string }[];
    children: ReactNode;
}>) {
    return (
        <div className="mt-6">
            {/* The gutter is padding on the wrapper rather than a margin on the
                scroller: a margin would sit outside the scroller's own width and
                push the whole card 58px wider than its column. */}
            <div className="relative" style={{ paddingLeft: VALUE_AXIS_WIDTH }}>
                <PinnedValueAxis ticks={ticks} />

                {/* Only the plot scrolls. The axis sits in the gutter and the key
                    below, both outside this container, so neither travels off
                    screen when the reader scrolls through the buckets. */}
                <div className="min-w-0 overflow-x-auto">
                    <div
                        style={{
                            minWidth: `${categories * perCategory}px`,
                            height: PLOT_HEIGHT,
                        }}
                        aria-label={label}
                    >
                        <ResponsiveContainer width="100%" height="100%">
                            {children}
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <ul className="text-muted-foreground mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs">
                {legend.map((item) => (
                    <li key={item.name} className="flex items-center gap-1.5">
                        <span
                            aria-hidden="true"
                            className="size-2.5 shrink-0 rounded-sm"
                            style={{ background: item.fill }}
                        />
                        {item.name}
                    </li>
                ))}
            </ul>
        </div>
    );
}

function ChartAxes({ ticks }: Readonly<{ ticks: number[] }>) {
    return (
        <>
            <CartesianGrid stroke="var(--border-color)" strokeDasharray="3 3" vertical={false} />

            <XAxis
                dataKey="name"
                height={X_AXIS_HEIGHT}
                tick={CHART_TICK}
                tickLine={false}
                axisLine={{ stroke: 'var(--border-color)' }}
            />

            {/* Hidden, not absent: it still defines the scale, and PinnedValueAxis
                renders the labels for it outside the scrolling area. */}
            <YAxis hide domain={[0, ticks.at(-1) ?? 0]} ticks={ticks} />
        </>
    );
}

/**
 * The value axis as HTML beside the plot rather than inside it, so it stays put
 * while the plot scrolls. Positions come from the same plot rectangle Recharts
 * derives from PLOT_HEIGHT, CHART_MARGIN and X_AXIS_HEIGHT, so a label sits on
 * the row its gridline is drawn.
 */
function PinnedValueAxis({ ticks }: Readonly<{ ticks: number[] }>) {
    const top = ticks.at(-1) ?? 0;
    const plotTop = CHART_MARGIN.top;
    const plotBottom = PLOT_HEIGHT - CHART_MARGIN.bottom - X_AXIS_HEIGHT;

    return (
        <div
            aria-hidden="true"
            className="bg-surface pointer-events-none absolute top-0 left-0 z-10"
            style={{ width: VALUE_AXIS_WIDTH, height: PLOT_HEIGHT }}
        >
            {ticks.map((tick) => (
                <span
                    key={tick}
                    className="text-muted-foreground absolute right-2 -translate-y-1/2 text-xs whitespace-nowrap"
                    style={{
                        top: plotBottom - (top === 0 ? 0 : tick / top) * (plotBottom - plotTop),
                    }}
                >
                    {formatCompactCurrency(tick)}
                </span>
            ))}
        </div>
    );
}

function ChartTooltip({
    showLabel = false,
}: Readonly<{
    showLabel?: boolean;
}>) {
    return (
        <Tooltip
            formatter={(value) => formatCurrency(Number(value))}
            labelFormatter={
                showLabel ? (label, payload) => payload[0]?.payload?.fullName ?? label : undefined
            }
            contentStyle={CHART_TOOLTIP_STYLE}
        />
    );
}

function AccessibleChartTable({
    caption,
    headers,
    rows,
}: Readonly<{
    caption: string;
    headers: string[];
    rows: ReactNode[];
}>) {
    return (
        <div className="fixed top-0 left-0 size-px overflow-hidden whitespace-nowrap [clip-path:inset(50%)]">
            <table>
                <caption>{caption}</caption>

                <thead>
                    <tr>
                        {headers.map((header) => (
                            <th key={header}>{header}</th>
                        ))}
                    </tr>
                </thead>

                <tbody>{rows}</tbody>
            </table>
        </div>
    );
}

interface PeriodPoint {
    label: string;
    amount: number;
    actualPaid: number;
    currentUserShare: number;
}

/**
 * Resolves the scoped groups into one labelled point per time bucket, at the
 * granularity the time filter implies. Daily needs every group to carry a daily
 * series, otherwise whichever group lacks one would be missing from the totals.
 */
function periodPoints(
    groups: DashboardGroupSpend[],
    dailyTrend: boolean,
): { daily: boolean; points: PeriodPoint[] } {
    const daily = dailyTrend && groups.every((group) => group.spendingByDay !== undefined);

    const points = daily
        ? combineDailySpending(groups).map((entry) => ({
              ...entry,
              label: shortDayLabel(entry.date),
          }))
        : combineMonthlySpending(groups).map((entry) => ({
              ...entry,
              label: monthLabel(entry.month),
          }));

    return { daily, points };
}

interface GroupBucketRow {
    name: string;
    /** One entry per group id, carrying that group's spend in this bucket. */
    [groupId: string]: string | number;
}

/**
 * A cluster per time bucket, one bar per group, so a reader can follow both
 * "which group costs most" and "how that changed over the range" in one chart.
 * Granularity follows the time filter: dates while the range is a calendar
 * month or less, months beyond that — the same rule the spending trend uses.
 */
function GroupSpendingChart({
    groups,
    dailyTrend,
}: Readonly<{
    groups: DashboardGroupSpend[];
    dailyTrend: boolean;
}>) {
    const active = groups.filter((group) => group.amount > 0);

    // Daily buckets need every group to carry a daily series; without that the
    // union would silently drop whichever group lacks one.
    const daily = dailyTrend && active.every((group) => group.spendingByDay !== undefined);
    const buckets = bucketGroupSpending(active, daily ? 'day' : 'month');

    const chartData: GroupBucketRow[] = buckets.map(({ bucket, amounts }) => ({
        ...amounts,
        name: daily ? shortDayLabel(bucket) : monthLabel(bucket),
    }));

    if (active.length === 0 || chartData.length === 0) {
        return <p className="text-muted-foreground mt-6 text-sm">No spending in this period.</p>;
    }

    const legend = active.map((group, index) => ({
        name: group.name,
        fill: COLORS[index % COLORS.length]!,
    }));
    const ticks = niceTicks(
        Math.max(...buckets.flatMap(({ amounts }) => Object.values(amounts)), 0),
    );

    return (
        <>
            <ScrollableChart
                categories={chartData.length}
                perCategory={Math.max(MIN_CATEGORY_WIDTH, active.length * MIN_BAR_WIDTH)}
                label="Spending by group chart"
                ticks={ticks}
                legend={legend}
            >
                <BarChart data={chartData} margin={CHART_MARGIN}>
                    <ChartAxes ticks={ticks} />

                    <ChartTooltip />

                    {active.map((group, index) => (
                        <Bar
                            key={group.groupId}
                            dataKey={group.groupId}
                            name={group.name}
                            fill={COLORS[index % COLORS.length]}
                            radius={BAR_RADIUS}
                            isAnimationActive
                        />
                    ))}
                </BarChart>
            </ScrollableChart>

            <AccessibleChartTable
                caption="Spending by group values"
                headers={[daily ? 'Day' : 'Month', ...active.map((group) => group.name)]}
                rows={chartData.map((entry) => (
                    <tr key={entry.name}>
                        <th>{entry.name}</th>
                        {active.map((group) => (
                            <td key={group.groupId}>
                                {formatCurrency(Number(entry[group.groupId] ?? 0))}
                            </td>
                        ))}
                    </tr>
                ))}
            />
        </>
    );
}

/**
 * Two bars per time bucket rather than one stack: what you actually paid out
 * beside what you were assigned, so the gap between them is the imbalance and
 * its direction is which bar is taller. Both series sit in the brand scale —
 * they are two readings of the same thing, not opposing outcomes.
 */
function ContributionTooltip({
    active,
    label,
    payload,
}: Readonly<{
    active?: boolean;
    label?: string;
    payload?: { payload?: ContributionDatum }[];
}>) {
    const datum = payload?.[0]?.payload;
    if (!active || !datum) return null;

    const { owed, owe } = contributionBalance(datum.paid, datum.share);
    const balanceLabel =
        owed > 0
            ? `You are owed ${formatCurrency(owed)}`
            : owe > 0
              ? `You owe ${formatCurrency(owe)}`
              : 'Level with your share';

    return (
        <div className="border-border bg-surface text-surface-foreground min-w-44 rounded-xl border px-3 py-2 text-xs shadow-lg">
            <p className="font-semibold">{label}</p>

            <dl className="mt-1 space-y-0.5">
                <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Paid by you</dt>
                    <dd>{formatCurrency(datum.paid)}</dd>
                </div>

                <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Your share</dt>
                    <dd>{formatCurrency(datum.share)}</dd>
                </div>
            </dl>

            <p className="text-muted-foreground mt-1.5 font-semibold">{balanceLabel}</p>
        </div>
    );
}

interface ContributionDatum {
    name: string;
    paid: number;
    share: number;
}

function ContributionChart({
    groups,
    dailyTrend,
}: Readonly<{
    groups: DashboardGroupSpend[];
    dailyTrend: boolean;
}>) {
    const { daily, points } = periodPoints(groups, dailyTrend);

    const chartData: ContributionDatum[] = points.map((point) => ({
        name: point.label,
        paid: point.actualPaid,
        share: point.currentUserShare,
    }));

    if (chartData.length === 0) {
        return <p className="text-muted-foreground mt-6 text-sm">No spending in this period.</p>;
    }

    const series = [
        { dataKey: 'paid', name: 'Paid by you', fill: 'var(--color-brand-600)' },
        { dataKey: 'share', name: 'Your share', fill: 'var(--color-brand-300)' },
    ] as const;

    const ticks = niceTicks(
        Math.max(...chartData.flatMap((entry) => [entry.paid, entry.share]), 0),
    );

    return (
        <>
            <ScrollableChart
                categories={chartData.length}
                label="Paid versus share chart"
                ticks={ticks}
                legend={series}
            >
                <BarChart data={chartData} margin={CHART_MARGIN}>
                    <ChartAxes ticks={ticks} />

                    <Tooltip cursor={{ fill: 'var(--muted)' }} content={<ContributionTooltip />} />

                    {series.map((bar) => (
                        <Bar
                            key={bar.dataKey}
                            dataKey={bar.dataKey}
                            name={bar.name}
                            fill={bar.fill}
                            radius={BAR_RADIUS}
                            isAnimationActive
                        />
                    ))}
                </BarChart>
            </ScrollableChart>

            <AccessibleChartTable
                caption="Paid versus share values"
                headers={[daily ? 'Day' : 'Month', 'Paid by you', 'Your share', 'Balance']}
                rows={chartData.map((entry) => {
                    const { owed, owe } = contributionBalance(entry.paid, entry.share);

                    return (
                        <tr key={entry.name}>
                            <th>{entry.name}</th>
                            <td>{formatCurrency(entry.paid)}</td>
                            <td>{formatCurrency(entry.share)}</td>
                            <td>
                                {owed > 0
                                    ? `You are owed ${formatCurrency(owed)}`
                                    : owe > 0
                                      ? `You owe ${formatCurrency(owe)}`
                                      : 'Level with your share'}
                            </td>
                        </tr>
                    );
                })}
            />
        </>
    );
}

function ShareDistributionChart({
    group,
}: Readonly<{
    group?: DashboardGroupSpend;
}>) {
    const activeMembers = sortMembersByName(
        (group?.memberShares ?? []).filter((member) => member.amount > 0),
        { isCurrentUser: (member) => member.isCurrentUser },
    );
    // Ordering has to settle before this: the returned names are aligned by
    // position with the array handed in.
    const disambiguatedNames = disambiguateParticipantNames(activeMembers);

    const chartData = activeMembers.map((member, index) => ({
        name: disambiguatedNames[index] ?? member.name,
        amount: member.amount,
        fill: COLORS[index % COLORS.length],
    }));

    if (!group) {
        return (
            <p className="text-muted-foreground mt-6 text-sm">
                Select one group to view participant shares.
            </p>
        );
    }

    if (chartData.length === 0) {
        return (
            <p className="text-muted-foreground mt-6 text-sm">
                No participant spending in this period.
            </p>
        );
    }

    return (
        <>
            <div className="mt-6 h-72 w-full min-w-0" aria-label="Participant share chart">
                <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                        <Pie
                            data={chartData}
                            dataKey="amount"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius="72%"
                            label={({ name, percent }) =>
                                `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`
                            }
                            isAnimationActive
                            shape={(props: PieSectorShapeProps) => (
                                <Sector
                                    {...props}
                                    fill={
                                        props.payload?.fill ?? COLORS[props.index % COLORS.length]
                                    }
                                />
                            )}
                        />

                        <ChartTooltip />
                    </RechartsPieChart>
                </ResponsiveContainer>
            </div>

            <AccessibleChartTable
                caption="Participant share values"
                headers={['Participant', 'Share']}
                rows={chartData.map((entry) => (
                    <tr key={entry.name}>
                        <th>{entry.name}</th>
                        <td>{formatCurrency(entry.amount)}</td>
                    </tr>
                ))}
            />
        </>
    );
}

/**
 * The running answer to "am I the one fronting money?": each bar is what you
 * had paid beyond your share by the end of that bucket, so the series crossing
 * zero is the moment the balance flipped. Bars are coloured by side rather than
 * by series, since the sign is the whole point.
 */
function NetPositionChart({
    groups,
    dailyTrend,
}: Readonly<{
    groups: DashboardGroupSpend[];
    dailyTrend: boolean;
}>) {
    const { daily, points } = periodPoints(groups, dailyTrend);

    const chartData = cumulativeNetPosition(points).map(({ entry, net, cumulative }) => ({
        name: entry.label,
        net,
        cumulative,
    }));

    if (chartData.length === 0) {
        return <p className="text-muted-foreground mt-6 text-sm">No spending in this period.</p>;
    }

    const closing = chartData.at(-1)?.cumulative ?? 0;

    return (
        <>
            <p className="text-muted-foreground mt-4 text-sm">
                {closing > 0
                    ? `By the end of this period you had fronted ${formatCurrency(closing)} more than your share.`
                    : closing < 0
                      ? `By the end of this period others had covered ${formatCurrency(Math.abs(closing))} of your share.`
                      : 'You ended this period level with your share.'}
            </p>

            <div className="mt-4 h-72 w-full min-w-0" aria-label="Net position over time chart">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={CHART_MARGIN}>
                        <CartesianGrid
                            stroke="var(--border-color)"
                            strokeDasharray="3 3"
                            vertical={false}
                        />

                        <XAxis
                            dataKey="name"
                            tick={CHART_TICK}
                            tickLine={false}
                            interval="preserveStartEnd"
                            axisLine={{ stroke: 'var(--border-color)' }}
                        />

                        <YAxis
                            width={58}
                            tickFormatter={formatCompactCurrency}
                            tick={CHART_TICK}
                            tickLine={false}
                            axisLine={false}
                        />

                        <ReferenceLine y={0} stroke="var(--muted-foreground)" />

                        <Tooltip
                            cursor={{ fill: 'var(--muted)' }}
                            formatter={(value) => formatCurrency(Number(value))}
                            contentStyle={CHART_TOOLTIP_STYLE}
                        />

                        <Bar dataKey="cumulative" name="Running position" isAnimationActive>
                            {chartData.map((entry) => (
                                <Cell
                                    key={entry.name}
                                    fill={
                                        entry.cumulative < 0
                                            ? 'var(--color-owe)'
                                            : 'var(--color-owed)'
                                    }
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <AccessibleChartTable
                caption="Net position over time values"
                headers={[daily ? 'Day' : 'Month', 'Change', 'Running position']}
                rows={chartData.map((entry) => (
                    <tr key={entry.name}>
                        <th>{entry.name}</th>
                        <td>{formatCurrency(entry.net)}</td>
                        <td>{formatCurrency(entry.cumulative)}</td>
                    </tr>
                ))}
            />
        </>
    );
}

function TrendChart({
    groups,
    selected,
    dailyTrend,
}: Readonly<{
    groups: DashboardGroupSpend[];
    selected?: DashboardGroupSpend;
    dailyTrend: boolean;
}>) {
    if (dailyTrend) {
        const data = selected
            ? selected.spendingByDay
            : groups.every((group) => group.spendingByDay !== undefined)
              ? combineDailySpending(groups)
              : undefined;

        return <SpendingTrendGraph data={data} granularity="day" />;
    }

    const data = selected ? selected.spendingByMonth : combineMonthlySpending(groups);

    return <SpendingTrendGraph data={data} granularity="month" />;
}

function AnalyticsSkeleton() {
    return (
        <div role="status" aria-label="Loading analytics" className="mx-auto max-w-7xl space-y-6">
            <div className="bg-muted h-12 w-72 animate-pulse rounded-lg" />

            <div className="bg-muted h-28 animate-pulse rounded-2xl" />

            <div className="grid gap-6">
                <div className="bg-muted h-96 animate-pulse rounded-2xl" />
                <div className="bg-muted h-96 animate-pulse rounded-2xl" />
            </div>
        </div>
    );
}

export function AnalyticsPage() {
    const [searchParams] = useSearchParams();

    const [period, setPeriod] = useState<DashboardPeriod>(() => presetPeriod('all-time'));

    const [scopeGroupId, setScopeGroupId] = useState<string | null>(() =>
        searchParams.get('groupId'),
    );

    const { data, isLoading, isError, refetch } = useDashboard(period.range);

    const selectedGroup = data?.groupSpend.find((group) => group.groupId === scopeGroupId);

    const effectiveGroupId = selectedGroup?.groupId ?? null;

    if (isLoading) {
        return <AnalyticsSkeleton />;
    }

    if (isError || !data) {
        return (
            <div className="mx-auto max-w-xl p-8 text-center">
                <h1 className="text-2xl font-semibold">We couldn't load analytics</h1>

                <p className="text-muted-foreground mt-2 text-sm">
                    Your expenses have not been changed. Try loading the analytics again.
                </p>

                <button
                    type="button"
                    onClick={() => void refetch()}
                    className="bg-brand-600 hover:bg-brand-700 mt-5 min-h-11 cursor-pointer rounded-lg px-4 text-sm font-semibold text-white"
                >
                    Retry
                </button>
            </div>
        );
    }

    const selected = data.groupSpend.find((group) => group.groupId === effectiveGroupId);

    const dailyTrend = usesDailyTrend(period);

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            <header className="flex flex-col gap-4">
                <div>
                    <p className="text-brand-700 dark:text-brand-300 text-sm font-semibold tracking-wide uppercase">
                        Insights
                    </p>

                    <h1 className="text-3xl font-semibold">Spending analytics</h1>

                    <p className="text-muted-foreground mt-1">
                        Explore your shared spending patterns across time, groups, and people.
                    </p>
                </div>

                <div className="flex w-full flex-col gap-3 sm:flex-row">
                    <DashboardTimeFilter period={period} onChange={setPeriod} />

                    {data.groupSpend.length > 1 && (
                        <GroupScopeSelector
                            scope="analytics"
                            groups={data.groupSpend}
                            value={effectiveGroupId}
                            onChange={setScopeGroupId}
                        />
                    )}
                </div>
            </header>

            <aside className="border-brand-200 bg-brand-50 text-brand-950 dark:border-brand-800 dark:bg-brand-950/30 dark:text-brand-100 rounded-xl border px-4 py-3 text-sm">
                <strong>Best on web:</strong> Use a larger screen for the clearest chart labels and
                comparisons. The data remains available on smaller devices.
            </aside>

            {data.groupSpend.length === 0 ? (
                <section className="border-border bg-muted/40 rounded-2xl border p-8 text-center">
                    <h2 className="text-2xl font-semibold">No shared spending yet</h2>

                    <p className="text-muted-foreground mt-2 text-sm">
                        Record a shared expense to see analytics here.
                    </p>

                    <Link
                        to="/groups"
                        className="bg-brand-600 hover:bg-brand-700 mt-5 inline-flex min-h-11 items-center rounded-lg px-4 text-sm font-semibold text-white"
                    >
                        Open groups
                    </Link>
                </section>
            ) : (
                <>
                    <ChartFrame
                        title="Spending trend"
                        description={`${dailyTrend ? 'Daily' : 'Monthly'} recorded expenses. Settlements are excluded.`}
                        icon={LineChart}
                    >
                        <TrendChart
                            groups={data.groupSpend}
                            selected={selected}
                            dailyTrend={dailyTrend}
                        />
                    </ChartFrame>

                    <div className="grid gap-6">
                        <ChartFrame
                            title="Spending by group"
                            description="Compare the total recorded expenses in each group."
                            icon={BarChartHorizontal}
                        >
                            <GroupSpendingChart
                                groups={selected ? [selected] : data.groupSpend}
                                dailyTrend={dailyTrend}
                            />
                        </ChartFrame>

                        <ChartFrame
                            title="Paid versus your share"
                            description="See where your contribution differs from your assigned share."
                            icon={BarChart3}
                        >
                            <ContributionChart
                                groups={selected ? [selected] : data.groupSpend}
                                dailyTrend={dailyTrend}
                            />
                        </ChartFrame>
                    </div>

                    <ChartFrame
                        title="Net position over time"
                        description="Track whether you have been fronting money or being carried, as it accumulates."
                        icon={TrendingUp}
                    >
                        <NetPositionChart
                            groups={selected ? [selected] : data.groupSpend}
                            dailyTrend={dailyTrend}
                        />
                    </ChartFrame>

                    <ChartFrame
                        title="Participant share"
                        description="Understand how a selected group's expenses are distributed."
                        icon={PieChart}
                    >
                        <ShareDistributionChart group={selected} />
                    </ChartFrame>
                </>
            )}
        </div>
    );
}
