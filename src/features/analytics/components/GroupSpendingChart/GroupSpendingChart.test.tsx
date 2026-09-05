import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { DashboardGroupSpend } from '@features/dashboard/api/dashboardApi';
import { GroupSpendingChart } from './GroupSpendingChart';

vi.mock('recharts', () => ({
    BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Bar: ({ name }: { name: string }) => <span>{name}</span>,
}));
vi.mock('@features/analytics/components/ChartAxes', () => ({ ChartAxes: () => null }));
vi.mock('@features/analytics/components/ChartTooltip', () => ({ ChartTooltip: () => null }));
vi.mock('@features/analytics/components/ScrollableChart', () => ({
    ScrollableChart: ({
        label,
        legend,
        children,
    }: {
        label: string;
        legend: { name: string }[];
        children: React.ReactNode;
    }) => (
        <div aria-label={label}>
            {legend.map((item) => item.name).join(',')}
            {children}
        </div>
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
});
