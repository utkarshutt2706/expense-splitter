import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { DashboardGroupSpend } from '@features/dashboard/api/dashboardApi';
import { TrendChart } from './TrendChart';

vi.mock('@features/dashboard/components/SpendingTrendChart', () => ({
    SpendingTrendChart: ({ data, granularity }: { data?: unknown[]; granularity: string }) => (
        <span data-testid="chart" data-granularity={granularity}>
            {data === undefined ? 'unavailable' : JSON.stringify(data)}
        </span>
    ),
}));

const group = (overrides: Partial<DashboardGroupSpend> = {}) =>
    ({
        groupId: 'group',
        name: 'Group',
        amount: 0,
        actualPaid: 0,
        currentUserShare: 0,
        currentBalance: 0,
        memberShares: [],
        spendingByMonth: [],
        ...overrides,
    }) as DashboardGroupSpend;

describe('TrendChart', () => {
    it('uses the selected group daily or monthly series directly', () => {
        const selected = group({
            spendingByDay: [{ date: '2026-08-01', amount: 5, actualPaid: 3, currentUserShare: 2 }],
            spendingByMonth: [{ month: '2026-08', amount: 5, actualPaid: 3, currentUserShare: 2 }],
        });
        const view = render(<TrendChart groups={[selected]} selected={selected} dailyTrend />);
        expect(screen.getByTestId('chart')).toHaveAttribute('data-granularity', 'day');
        expect(screen.getByTestId('chart')).toHaveTextContent('2026-08-01');
        view.rerender(<TrendChart groups={[selected]} selected={selected} dailyTrend={false} />);
        expect(screen.getByTestId('chart')).toHaveAttribute('data-granularity', 'month');
        expect(screen.getByTestId('chart')).toHaveTextContent('2026-08');
    });

    it('combines group series and marks incomplete daily data unavailable', () => {
        const one = group({
            spendingByMonth: [{ month: '2026-08', amount: 5, actualPaid: 3, currentUserShare: 2 }],
            spendingByDay: [{ date: '2026-08-01', amount: 5, actualPaid: 3, currentUserShare: 2 }],
        });
        const two = group({
            groupId: 'two',
            spendingByMonth: [{ month: '2026-08', amount: 4, actualPaid: 1, currentUserShare: 3 }],
        });
        const view = render(<TrendChart groups={[one, two]} dailyTrend />);
        expect(screen.getByTestId('chart')).toHaveTextContent('unavailable');
        view.rerender(<TrendChart groups={[one, two]} dailyTrend={false} />);
        expect(screen.getByTestId('chart')).toHaveTextContent('"amount":9');
    });
});
