import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { DashboardGroupSpend } from '@features/dashboard/api/dashboardApi';
import {
    ANALYTICS_BAR_RADIUS,
    ANALYTICS_CHART_COLORS,
    ANALYTICS_CHART_MARGIN,
    MIN_BAR_WIDTH,
} from '@features/analytics/utils';
import { GroupSpendingChart } from './GroupSpendingChart';

const mocks = vi.hoisted(() => ({ barChart: vi.fn(), bar: vi.fn(), scrollable: vi.fn() }));
vi.mock('recharts', () => ({
    BarChart: (props: { children: React.ReactNode }) => (
        mocks.barChart(props),
        (<div>{props.children}</div>)
    ),
    Bar: (props: { name: string }) => (mocks.bar(props), (<span>{props.name}</span>)),
}));
vi.mock('@features/analytics/components/ChartAxes', () => ({ ChartAxes: () => null }));
vi.mock('@features/analytics/components/ChartTooltip', () => ({ ChartTooltip: () => null }));
vi.mock('@features/analytics/components/ScrollableChart', () => ({
    ScrollableChart: ({
        categories,
        perCategory,
        label,
        ticks,
        legend,
        children,
    }: {
        categories: number;
        perCategory?: number;
        label: string;
        ticks: number[];
        legend: { name: string }[];
        children: React.ReactNode;
    }) => (
        mocks.scrollable({ categories, perCategory, label, ticks, legend }),
        (
            <div aria-label={label}>
                {legend.map((item) => item.name).join(',')}
                {children}
            </div>
        )
    ),
}));

function group(overrides: Partial<DashboardGroupSpend> = {}): DashboardGroupSpend {
    return {
        groupId: 'g',
        name: 'Group',
        amount: 10,
        actualPaid: 0,
        currentUserShare: 0,
        currentBalance: 0,
        memberShares: [],
        spendingByMonth: [],
        ...overrides,
    };
}

describe('GroupSpendingChart', () => {
    it('ignores inactive groups and renders an empty state without spending', () => {
        render(<GroupSpendingChart groups={[group({ amount: 0 })]} dailyTrend={false} />);
        expect(screen.getByText('No spending in this period.')).toBeInTheDocument();
    });

    it('builds daily buckets across active groups and fills missing values with zero', () => {
        render(
            <GroupSpendingChart
                groups={[
                    group({
                        groupId: 'trips',
                        name: 'Trips',
                        spendingByDay: [
                            { date: '2026-08-01', amount: 25, actualPaid: 0, currentUserShare: 0 },
                        ],
                    }),
                    group({ groupId: 'home', name: 'Home', spendingByDay: [] }),
                ]}
                dailyTrend
            />,
        );

        expect(screen.getByLabelText('Spending by group chart')).toHaveTextContent('Trips,Home');
        const table = screen.getByRole('table', { name: 'Spending by group values' });
        expect(table).toHaveTextContent('Day');
        expect(table).toHaveTextContent('1 Aug');
        expect(table).toHaveTextContent('25');
        expect(table).toHaveTextContent('0');
        expect(mocks.barChart).toHaveBeenLastCalledWith(
            expect.objectContaining({
                data: [{ name: '1 Aug', trips: 25, home: 0 }],
                margin: ANALYTICS_CHART_MARGIN,
            }),
        );
        expect(mocks.bar.mock.calls.map(([props]) => props)).toEqual([
            expect.objectContaining({
                dataKey: 'trips',
                fill: ANALYTICS_CHART_COLORS[0],
                radius: ANALYTICS_BAR_RADIUS,
            }),
            expect.objectContaining({
                dataKey: 'home',
                fill: ANALYTICS_CHART_COLORS[1],
                radius: ANALYTICS_BAR_RADIUS,
            }),
        ]);
        expect(mocks.scrollable).toHaveBeenLastCalledWith(
            expect.objectContaining({
                label: 'Spending by group chart',
                legend: [
                    { name: 'Trips', fill: ANALYTICS_CHART_COLORS[0] },
                    { name: 'Home', fill: ANALYTICS_CHART_COLORS[1] },
                ],
            }),
        );
    });

    it('falls back to month buckets when an active group lacks daily data', () => {
        render(
            <GroupSpendingChart
                groups={[
                    group({
                        spendingByMonth: [
                            { month: '2026-08', amount: 10, actualPaid: 0, currentUserShare: 0 },
                        ],
                    }),
                ]}
                dailyTrend
            />,
        );
        expect(screen.getByRole('table', { name: 'Spending by group values' })).toHaveTextContent(
            'Month',
        );
        expect(screen.getByText('Aug 26')).toBeInTheDocument();
    });

    it('allocates enough width for every group and cycles colors after the palette ends', () => {
        const groups = Array.from({ length: ANALYTICS_CHART_COLORS.length + 1 }, (_, index) =>
            group({
                groupId: `g-${index}`,
                name: `Group ${index}`,
                spendingByMonth: [
                    { month: '2026-08', amount: index + 1, actualPaid: 0, currentUserShare: 0 },
                ],
            }),
        );

        render(<GroupSpendingChart groups={groups} dailyTrend={false} />);

        expect(mocks.scrollable).toHaveBeenLastCalledWith(
            expect.objectContaining({ perCategory: groups.length * MIN_BAR_WIDTH }),
        );
        const lastBar = mocks.bar.mock.calls.at(-1)?.[0] as { fill: string };
        expect(lastBar.fill).toBe(ANALYTICS_CHART_COLORS[0]);
    });
});
