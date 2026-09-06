import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { DashboardGroupSpend } from '@features/dashboard/api/dashboardApi';
import { ANALYTICS_BAR_RADIUS, ANALYTICS_CHART_MARGIN } from '@features/analytics/utils';
import { ContributionChart } from './ContributionChart';

const mocks = vi.hoisted(() => ({ barChart: vi.fn(), bar: vi.fn(), scrollable: vi.fn() }));
vi.mock('recharts', () => ({
    BarChart: (props: { children: React.ReactNode }) => (
        mocks.barChart(props),
        (<div>{props.children}</div>)
    ),
    Bar: (props: { name: string }) => (mocks.bar(props), (<span>{props.name}</span>)),
    Tooltip: () => null,
}));
vi.mock('@features/analytics/components/ChartAxes', () => ({ ChartAxes: () => null }));
vi.mock('@features/analytics/components/ScrollableChart', () => ({
    ScrollableChart: ({
        categories,
        label,
        ticks,
        legend,
        children,
    }: {
        categories: number;
        label: string;
        ticks: number[];
        legend: { name: string }[];
        children: React.ReactNode;
    }) => (
        mocks.scrollable({ categories, label, ticks, legend }),
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
        amount: 0,
        actualPaid: 0,
        currentUserShare: 0,
        currentBalance: 0,
        memberShares: [],
        spendingByMonth: [],
        ...overrides,
    };
}

describe('ContributionChart', () => {
    it('renders its empty state when there are no period points', () => {
        render(<ContributionChart groups={[]} dailyTrend={false} />);
        expect(screen.getByText('No spending in this period.')).toBeInTheDocument();
    });

    it('renders combined daily paid, share, and balance values', () => {
        render(
            <ContributionChart
                groups={[
                    group({
                        spendingByDay: [
                            {
                                date: '2026-08-01',
                                amount: 100,
                                actualPaid: 120,
                                currentUserShare: 50,
                            },
                        ],
                    }),
                ]}
                dailyTrend
            />,
        );

        expect(screen.getByLabelText('Paid versus share chart')).toHaveTextContent(
            'Paid by you,Your share',
        );
        const table = screen.getByRole('table', { name: 'Paid versus share values' });
        expect(table).toHaveTextContent('Day');
        expect(table).toHaveTextContent('1 Aug');
        expect(table).toHaveTextContent('120');
        expect(table).toHaveTextContent('50');
        expect(table).toHaveTextContent(/owed/i);

        expect(mocks.barChart).toHaveBeenLastCalledWith(
            expect.objectContaining({
                data: [{ name: '1 Aug', paid: 120, share: 50 }],
                margin: ANALYTICS_CHART_MARGIN,
            }),
        );
        expect(mocks.bar.mock.calls.map(([props]) => props)).toEqual([
            expect.objectContaining({
                dataKey: 'paid',
                name: 'Paid by you',
                radius: ANALYTICS_BAR_RADIUS,
            }),
            expect.objectContaining({
                dataKey: 'share',
                name: 'Your share',
                radius: ANALYTICS_BAR_RADIUS,
            }),
        ]);
        expect(mocks.scrollable).toHaveBeenLastCalledWith(
            expect.objectContaining({ label: 'Paid versus share chart' }),
        );
    });

    it('labels fallback data by month when daily series are incomplete', () => {
        render(
            <ContributionChart
                groups={[
                    group({
                        spendingByMonth: [
                            { month: '2026-08', amount: 10, actualPaid: 4, currentUserShare: 8 },
                        ],
                    }),
                ]}
                dailyTrend
            />,
        );
        expect(screen.getByRole('table', { name: 'Paid versus share values' })).toHaveTextContent(
            'Month',
        );
        expect(screen.getByText('Aug 26')).toBeInTheDocument();
    });
});
