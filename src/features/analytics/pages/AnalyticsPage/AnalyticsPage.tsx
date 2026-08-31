import { BarChart3, BarChartHorizontal, LineChart, PieChart, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';

import {
    AnalyticsSkeleton,
    AnalyticsTrendChart,
    ChartFrame,
    ContributionChart,
    GroupSpendingChart,
    NetPositionChart,
    ShareDistributionChart,
} from '@features/analytics/components';
import { DashboardTimeFilter, GroupScopeSelector } from '@features/dashboard/components';
import { useDashboard } from '@features/dashboard/hooks';
import { presetPeriod, usesDailyTrend, type DashboardPeriod } from '@features/dashboard/utils';

export function AnalyticsPage() {
    const [searchParams] = useSearchParams();
    const [period, setPeriod] = useState<DashboardPeriod>(() => presetPeriod('all-time'));
    const [scopeGroupId, setScopeGroupId] = useState<string | null>(() =>
        searchParams.get('groupId'),
    );
    const { data, isLoading, isError, refetch } = useDashboard(period.range);
    const selectedGroup = data?.groupSpend.find((group) => group.groupId === scopeGroupId);
    const effectiveGroupId = selectedGroup?.groupId ?? null;

    if (isLoading) return <AnalyticsSkeleton />;
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
    const scopedGroups = selected ? [selected] : data.groupSpend;
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
                        <AnalyticsTrendChart
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
                            <GroupSpendingChart groups={scopedGroups} dailyTrend={dailyTrend} />
                        </ChartFrame>
                        <ChartFrame
                            title="Paid versus your share"
                            description="See where your contribution differs from your assigned share."
                            icon={BarChart3}
                        >
                            <ContributionChart groups={scopedGroups} dailyTrend={dailyTrend} />
                        </ChartFrame>
                    </div>
                    <ChartFrame
                        title="Net position over time"
                        description="Track whether you have been fronting money or being carried, as it accumulates."
                        icon={TrendingUp}
                    >
                        <NetPositionChart groups={scopedGroups} dailyTrend={dailyTrend} />
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
