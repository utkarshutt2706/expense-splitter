import { useState } from 'react';

import type { DashboardGroupSpend } from '@features/dashboard/api/dashboardApi';
import {
    DashboardError,
    DashboardResults,
    DashboardSkeleton,
    DashboardTimeFilter,
    GroupScopeSelector,
} from '@features/dashboard/components';
import { useDashboard } from '@features/dashboard/hooks';
import { presetPeriod } from '@features/dashboard/utils';

function selectDashboardGroup(
    groups: DashboardGroupSpend[],
    scopeGroupId: string | null,
): DashboardGroupSpend | undefined {
    const scopedGroup = groups.find((group) => group.groupId === scopeGroupId);
    if (scopedGroup) return scopedGroup;
    if (groups.length === 1) return groups[0];
    return undefined;
}

export function DashboardPage() {
    const [period, setPeriod] = useState(() => presetPeriod('all-time'));
    const { data, isLoading, isError, refetch } = useDashboard(period.range);
    const [scopeGroupId, setScopeGroupId] = useState<string | null>(null);

    if (isLoading) return <DashboardSkeleton />;
    if (isError || !data) return <DashboardError onRetry={() => void refetch()} />;

    const selected = selectDashboardGroup(data.groupSpend, scopeGroupId);

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            <header className="flex flex-col gap-4">
                <div>
                    <h1 className="text-3xl font-semibold">Spending overview</h1>
                    <p className="text-muted-foreground mt-1">
                        Your shared spending and balances across groups
                    </p>
                </div>
                <div className="flex w-full flex-col gap-3 sm:flex-row">
                    <DashboardTimeFilter period={period} onChange={setPeriod} />
                    {data.groupSpend.length > 1 && (
                        <GroupScopeSelector
                            scope="dashboard"
                            groups={data.groupSpend}
                            value={scopeGroupId}
                            onChange={setScopeGroupId}
                        />
                    )}
                </div>
            </header>
            <DashboardResults data={data} selected={selected} period={period} />
        </div>
    );
}
