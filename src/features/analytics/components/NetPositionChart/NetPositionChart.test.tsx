import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { DashboardGroupSpend } from '@features/dashboard/api/dashboardApi';
import { NetPositionChart } from './NetPositionChart';

vi.mock('recharts', () => ({
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => children,
    BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Bar: () => null,
    CartesianGrid: () => null,
    ReferenceLine: () => null,
    Tooltip: () => null,
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
});
