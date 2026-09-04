import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { DashboardGroupSpend, DashboardSummary } from '@features/dashboard/api/dashboardApi';
import type { DashboardPeriod } from '@features/dashboard/utils';
import { DashboardResults } from './DashboardResults';

vi.mock('@features/dashboard/components/CurrentPosition', () => ({
    CurrentPosition: () => <span data-testid="position" />,
}));
vi.mock('@features/dashboard/components/EmptyDashboard', () => ({
    EmptyDashboard: () => <span data-testid="empty" />,
}));
vi.mock('@features/dashboard/components/GroupBreakdown', () => ({
    GroupBreakdown: () => <span data-testid="breakdown" />,
}));
vi.mock('@features/dashboard/components/NoSpendingState', () => ({
    NoSpendingState: (props: object) => (
        <span data-testid="no-spending" data-props={JSON.stringify(props)} />
    ),
}));
vi.mock('@features/dashboard/components/Participants', () => ({
    Participants: () => <span data-testid="participants" />,
}));
vi.mock('@features/dashboard/components/SpendingSummary', () => ({
    SpendingSummary: (props: object) => (
        <span data-testid="summary" data-props={JSON.stringify(props)} />
    ),
}));
vi.mock('@features/dashboard/components/TrendChart', () => ({
    TrendChart: (props: { dailyTrend: boolean }) => (
        <span data-testid="trend" data-daily={props.dailyTrend} />
    ),
}));

const group = (overrides: Partial<DashboardGroupSpend> = {}) =>
    ({
        groupId: 'group-1',
        name: 'Trip',
        amount: 100,
        actualPaid: 60,
        currentUserShare: 40,
        currentBalance: 20,
        memberShares: [],
        spendingByMonth: [],
        ...overrides,
    }) as DashboardGroupSpend;
const summary = (groups: DashboardGroupSpend[]) =>
    ({ groupSpend: groups, actualPaid: 60, currentUserShare: 40 }) as DashboardSummary;
const overall: DashboardPeriod = { preset: 'all-time', label: 'Overall' };
const month: DashboardPeriod = { preset: 'this-month', label: 'This month' };

describe('DashboardResults', () => {
    it('renders the empty dashboard when there are no groups', () => {
        render(<DashboardResults data={summary([])} period={overall} />);
        expect(screen.getByTestId('empty')).toBeInTheDocument();
        expect(screen.queryByTestId('summary')).not.toBeInTheDocument();
    });

    it('renders selected-group spending, position, trend, and participants', () => {
        const selected = group();
        render(
            <DashboardResults data={summary([selected])} selected={selected} period={overall} />,
        );
        expect(screen.getByTestId('position')).toBeInTheDocument();
        expect(JSON.parse(screen.getByTestId('summary').dataset.props!)).toMatchObject({
            paid: 60,
            share: 40,
            total: 100,
            periodLabel: 'Overall',
        });
        expect(screen.getByTestId('trend')).toHaveAttribute('data-daily', 'false');
        expect(screen.getByTestId('participants')).toBeInTheDocument();
    });

    it('uses a selected-group no-spending action and omits non-all-time position', () => {
        const selected = group({ amount: 0 });
        render(<DashboardResults data={summary([selected])} selected={selected} period={month} />);
        expect(JSON.parse(screen.getByTestId('no-spending').dataset.props!)).toMatchObject({
            link: '/groups/group-1/expenses/new',
            linkLabel: 'Add expense',
        });
        expect(screen.queryByTestId('position')).not.toBeInTheDocument();
        expect(screen.getByTestId('participants')).toBeInTheDocument();
    });

    it('renders aggregate summary, daily trend, and group breakdown when expenses exist', () => {
        render(<DashboardResults data={summary([group()])} period={month} />);
        expect(screen.getByTestId('summary')).toBeInTheDocument();
        expect(screen.getByTestId('trend')).toHaveAttribute('data-daily', 'true');
        expect(screen.getByTestId('breakdown')).toBeInTheDocument();
    });

    it('renders aggregate no-spending guidance when every group has zero spending', () => {
        render(<DashboardResults data={summary([group({ amount: 0 })])} period={month} />);
        expect(JSON.parse(screen.getByTestId('no-spending').dataset.props!)).toMatchObject({
            link: '/groups/group-1',
            linkLabel: 'Open group',
        });
        expect(screen.queryByTestId('breakdown')).not.toBeInTheDocument();
    });
});
