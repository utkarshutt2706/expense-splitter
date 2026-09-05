import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { DashboardGroupSpend } from '@features/dashboard/api/dashboardApi';
import { ShareDistributionChart } from './ShareDistributionChart';

const pie = vi.hoisted(() => vi.fn());
vi.mock('recharts', () => ({
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => children,
    PieChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Pie: (props: unknown) => (pie(props), null),
}));
vi.mock('@features/analytics/components/ChartTooltip', () => ({ ChartTooltip: () => null }));

function group(memberShares: DashboardGroupSpend['memberShares']): DashboardGroupSpend {
    return {
        groupId: 'g',
        name: 'Group',
        amount: 100,
        actualPaid: 0,
        currentUserShare: 0,
        currentBalance: 0,
        memberShares,
        spendingByMonth: [],
    };
}

describe('ShareDistributionChart', () => {
    it('asks for a group before rendering participant shares', () => {
        render(<ShareDistributionChart />);
        expect(screen.getByText(/select one group/i)).toBeInTheDocument();
    });

    it('renders an empty state when no participant has a positive share', () => {
        render(
            <ShareDistributionChart
                group={group([{ userId: 'u', name: 'Alex', amount: 0, isCurrentUser: true }])}
            />,
        );
        expect(screen.getByText(/no participant spending/i)).toBeInTheDocument();
    });

    it('puts the current user first, filters zero shares, and disambiguates duplicate names', () => {
        render(
            <ShareDistributionChart
                group={group([
                    { userId: 'other', name: 'Alex', amount: 25, isCurrentUser: false },
                    { userId: 'zero', name: 'Zoe', amount: 0, isCurrentUser: false },
                    { userId: 'me', name: 'Alex', amount: 75, isCurrentUser: true },
                ])}
            />,
        );

        expect(screen.getByLabelText('Participant share chart')).toBeInTheDocument();
        const table = screen.getByRole('table', { name: 'Participant share values' });
        const rows = table.querySelectorAll('tbody tr');
        expect(rows).toHaveLength(2);
        expect(rows[0]).toHaveTextContent('You');
        expect(rows[0]).toHaveTextContent('75');
        expect(rows[1]).toHaveTextContent('Alex');
        expect(table).not.toHaveTextContent('Zoe');
        const props = pie.mock.lastCall?.[0] as {
            data: unknown[];
            label: (value: { name: string; percent?: number }) => string;
        };
        expect(props.data).toHaveLength(2);
        expect(props.label({ name: 'Alex', percent: 0.75 })).toBe('Alex: 75%');
    });
});
