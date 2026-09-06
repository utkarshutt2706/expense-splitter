import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { DashboardGroupSpend } from '@features/dashboard/api/dashboardApi';
import { ANALYTICS_CHART_COLORS } from '@features/analytics/utils';
import { ColoredPieSector } from '@features/analytics/components/ColoredPieSector';
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
            data: { name: string; amount: number; fill: string }[];
            label: (value: { name: string; percent?: number }) => string;
            shape: unknown;
        };
        expect(props.data).toEqual([
            { name: 'You', amount: 75, fill: ANALYTICS_CHART_COLORS[0] },
            { name: 'Alex', amount: 25, fill: ANALYTICS_CHART_COLORS[1] },
        ]);
        expect(props.shape).toBe(ColoredPieSector);
        expect(props.label({ name: 'Alex', percent: 0.75 })).toBe('Alex: 75%');
        expect(props.label({ name: 'Alex' })).toBe('Alex: 0%');
    });

    it('filters negative shares and cycles colors for a participant list larger than the palette', () => {
        const participants = Array.from(
            { length: ANALYTICS_CHART_COLORS.length + 1 },
            (_, index) => ({
                userId: `u-${index}`,
                name: `Participant ${String(index).padStart(2, '0')}`,
                amount: index + 1,
                isCurrentUser: false,
            }),
        );
        participants.push({
            userId: 'negative',
            name: 'Negative',
            amount: -10,
            isCurrentUser: false,
        });

        render(<ShareDistributionChart group={group(participants)} />);

        const data = (pie.mock.lastCall?.[0] as { data: { fill: string }[] }).data;
        expect(data).toHaveLength(ANALYTICS_CHART_COLORS.length + 1);
        expect(data.at(-1)?.fill).toBe(ANALYTICS_CHART_COLORS[0]);
        expect(
            screen.getByRole('table', { name: 'Participant share values' }),
        ).not.toHaveTextContent('Negative');
    });
});
