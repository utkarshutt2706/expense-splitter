import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { DashboardGroupSpend } from '@features/dashboard/api/dashboardApi';
import { AnalyticsTrendChart } from './AnalyticsTrendChart';

vi.mock('@features/dashboard/components', () => ({
    SpendingTrendGraph: ({ data, granularity }: { data?: unknown[]; granularity: string }) => (
        <span data-testid="trend" data-granularity={granularity}>
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

describe('AnalyticsTrendChart', () => {
    it('forwards the selected group daily and monthly series', () => {
        const selected = group({
            spendingByDay: [{ date: '2026-08-01', amount: 5, actualPaid: 3, currentUserShare: 2 }],
            spendingByMonth: [{ month: '2026-08', amount: 5, actualPaid: 3, currentUserShare: 2 }],
        });
        const view = render(
            <AnalyticsTrendChart groups={[selected]} selected={selected} dailyTrend />,
        );
        expect(screen.getByTestId('trend')).toHaveAttribute('data-granularity', 'day');
        expect(screen.getByTestId('trend')).toHaveTextContent('2026-08-01');
        view.rerender(
            <AnalyticsTrendChart groups={[selected]} selected={selected} dailyTrend={false} />,
        );
        expect(screen.getByTestId('trend')).toHaveAttribute('data-granularity', 'month');
        expect(screen.getByTestId('trend')).toHaveTextContent('2026-08');
    });

    it('combines group series and leaves incomplete daily data unavailable', () => {
        const one = group({
            spendingByMonth: [{ month: '2026-08', amount: 5, actualPaid: 3, currentUserShare: 2 }],
            spendingByDay: [{ date: '2026-08-01', amount: 5, actualPaid: 3, currentUserShare: 2 }],
        });
        const two = group({
            groupId: 'two',
            spendingByMonth: [{ month: '2026-08', amount: 4, actualPaid: 1, currentUserShare: 3 }],
        });
        const view = render(<AnalyticsTrendChart groups={[one, two]} dailyTrend />);
        expect(screen.getByTestId('trend')).toHaveTextContent('unavailable');
        view.rerender(<AnalyticsTrendChart groups={[one, two]} dailyTrend={false} />);
        expect(screen.getByTestId('trend')).toHaveTextContent('"amount":9');
    });
});
