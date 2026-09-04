import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import type { DashboardGroupSpend } from '@features/dashboard/api/dashboardApi';
import { GroupBreakdown } from './GroupBreakdown';

vi.mock('@features/dashboard/components/BalanceText', () => ({
    BalanceText: ({ value }: { value: number }) => <span data-testid="balance">{value}</span>,
}));
vi.mock('@features/dashboard/components/GroupContribution', () => ({
    GroupContribution: ({ compareWithBars }: { compareWithBars: boolean }) => (
        <span data-testid="contribution" data-bars={compareWithBars} />
    ),
}));

const group = (index: number) =>
    ({
        groupId: `${index}`,
        name: `Group ${index}`,
        amount: index * 10,
        currentBalance: index,
    }) as DashboardGroupSpend;
const renderList = (groups: DashboardGroupSpend[]) =>
    render(
        <MemoryRouter>
            <GroupBreakdown groups={groups} />
        </MemoryRouter>,
    );

describe('GroupBreakdown', () => {
    it('renders group navigation, totals, balances, and comparison mode', () => {
        renderList([group(1), group(2)]);
        expect(screen.getByRole('heading', { name: 'Spending by group' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /Group 1/ })).toHaveAttribute('href', '/groups/1');
        expect(screen.getByText('₹10.00')).toBeInTheDocument();
        expect(screen.getAllByTestId('balance').map((node) => node.textContent)).toEqual([
            '1',
            '2',
        ]);
        expect(screen.getAllByTestId('contribution')[0]).toHaveAttribute('data-bars', 'true');
    });

    it('uses compact contributions for one group', () => {
        renderList([group(1)]);
        expect(screen.getByTestId('contribution')).toHaveAttribute('data-bars', 'false');
    });

    it('limits large collections and toggles all groups', () => {
        renderList(Array.from({ length: 8 }, (_, index) => group(index + 1)));
        expect(screen.getAllByRole('link')).toHaveLength(6);
        fireEvent.click(screen.getByRole('button', { name: 'View all 8 groups' }));
        expect(screen.getAllByRole('link')).toHaveLength(8);
        fireEvent.click(screen.getByRole('button', { name: 'Show fewer groups' }));
        expect(screen.getAllByRole('link')).toHaveLength(6);
    });
});
