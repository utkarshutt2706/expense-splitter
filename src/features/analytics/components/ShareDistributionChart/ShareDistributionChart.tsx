import { Pie, PieChart, ResponsiveContainer } from 'recharts';
import type { DashboardGroupSpend } from '@features/dashboard/api/dashboardApi';
import { AccessibleChartTable } from '@features/analytics/components/AccessibleChartTable';
import { ChartTooltip } from '@features/analytics/components/ChartTooltip';
import { ColoredPieSector } from '@features/analytics/components/ColoredPieSector';
import { ANALYTICS_CHART_COLORS } from '@features/analytics/utils';
import { disambiguateParticipantNames, formatCurrency, sortMembersByName } from '@shared/utils';

export type ShareDistributionChartProps = Readonly<{ group?: DashboardGroupSpend }>;
export function ShareDistributionChart({ group }: ShareDistributionChartProps) {
    const activeMembers = sortMembersByName(
        (group?.memberShares ?? []).filter((member) => member.amount > 0),
        { isCurrentUser: (member) => member.isCurrentUser },
    );
    const names = disambiguateParticipantNames(activeMembers);
    const chartData = activeMembers.map((member, index) => ({
        name: names[index] ?? member.name,
        amount: member.amount,
        fill: ANALYTICS_CHART_COLORS[index % ANALYTICS_CHART_COLORS.length],
    }));
    if (!group)
        return (
            <p className="text-muted-foreground mt-6 text-sm">
                Select one group to view participant shares.
            </p>
        );
    if (chartData.length === 0)
        return (
            <p className="text-muted-foreground mt-6 text-sm">
                No participant spending in this period.
            </p>
        );
    return (
        <>
            <div className="mt-6 h-72 w-full min-w-0" aria-label="Participant share chart">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
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
                            shape={ColoredPieSector}
                        />
                        <ChartTooltip />
                    </PieChart>
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
