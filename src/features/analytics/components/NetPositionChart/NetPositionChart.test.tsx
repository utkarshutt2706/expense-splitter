import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { DashboardGroupSpend } from '@features/dashboard/api/dashboardApi';
import { NetPositionChart } from './NetPositionChart';

const mocks = vi.hoisted(() => ({ tooltip: vi.fn(), barChart: vi.fn(), bar: vi.fn() }));
vi.mock('recharts', () => ({
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => children,
    BarChart: (props: { children: React.ReactNode }) => (
        mocks.barChart(props),
        (<div>{props.children}</div>)
    ),
    Bar: (props: unknown) => (mocks.bar(props), null),
    CartesianGrid: () => null,
    ReferenceLine: () => null,
    Tooltip: (props: unknown) => (mocks.tooltip(props), null),
    XAxis: () => null,
    YAxis: () => null,
}));

function group(actualPaid: number, currentUserShare: number): DashboardGroupSpend {
    return {
        groupId: 'g',
        name: 'Group',
        amount: 100,
        actualPaid,
        currentUserShare,
        currentBalance: 0,
        memberShares: [],
        spendingByMonth: [{ month: '2026-08', amount: 100, actualPaid, currentUserShare }],
    };
}

describe('NetPositionChart', () => {
    it('renders an empty state without period points', () => {
        render(<NetPositionChart groups={[]} dailyTrend={false} />);
        expect(screen.getByText('No spending in this period.')).toBeInTheDocument();
    });

    it.each([
        [120, 50, /you had fronted/i],
        [40, 90, /others had covered/i],
        [75, 75, /ended this period level/i],
    ])(
        'describes and tables the closing position for paid %s and share %s',
        (paid, share, description) => {
            render(<NetPositionChart groups={[group(paid, share)]} dailyTrend={false} />);
            expect(screen.getByText(description)).toBeInTheDocument();
            expect(screen.getByLabelText('Net position over time chart')).toBeInTheDocument();
            const table = screen.getByRole('table', { name: 'Net position over time values' });
            expect(table).toHaveTextContent('Month');
            expect(table).toHaveTextContent('Aug 26');
            expect(table).toHaveTextContent(String(Math.abs(paid - share)));
        },
    );

    it('formats tooltip values as currency', () => {
        render(<NetPositionChart groups={[group(120, 50)]} dailyTrend={false} />);

        const formatter = (
            mocks.tooltip.mock.lastCall?.[0] as { formatter: (value: unknown) => string }
        ).formatter;
        expect(formatter('70')).toContain('70.00');
    });

    it('passes each signed change, cumulative value, and semantic fill to the chart', () => {
        const first = group(100, 40);
        first.spendingByMonth = [
            { month: '2026-07', amount: 100, actualPaid: 100, currentUserShare: 40 },
            { month: '2026-08', amount: 100, actualPaid: 0, currentUserShare: 90 },
        ];

        render(<NetPositionChart groups={[first]} dailyTrend={false} />);

        expect(mocks.barChart).toHaveBeenLastCalledWith(
            expect.objectContaining({
                data: [
                    { name: 'Jul 26', net: 60, cumulative: 60, fill: 'var(--color-owed)' },
                    { name: 'Aug 26', net: -90, cumulative: -30, fill: 'var(--color-owe)' },
                ],
            }),
        );
        expect(mocks.bar).toHaveBeenLastCalledWith(
            expect.objectContaining({
                dataKey: 'cumulative',
                name: 'Running position',
                isAnimationActive: true,
            }),
        );
        expect(
            screen.getByRole('table', { name: 'Net position over time values' }),
        ).toHaveTextContent('Jul 26');
    });
});
