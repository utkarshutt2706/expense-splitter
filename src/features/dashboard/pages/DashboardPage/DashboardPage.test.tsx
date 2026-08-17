import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { DashboardSummary } from '@features/dashboard/api/dashboardApi';
import { useDashboard } from '@features/dashboard/hooks';
import { DashboardPage } from './DashboardPage';
import { comparisonScale, contributionCopy } from './dashboardMetrics';

vi.mock('@features/dashboard/hooks', () => ({ useDashboard: vi.fn() }));

const dashboard: DashboardSummary = {
    actualPaid: 3200,
    currentUserShare: 1250,
    groupSpend: [
        {
            groupId: 'trip',
            name: 'A very long Goa trip group name',
            amount: 3000,
            actualPaid: 2800,
            currentUserShare: 1000,
            currentBalance: -125,
            memberShares: [
                {
                    userId: 'friend',
                    name: 'A participant with a very long name',
                    amount: 2000,
                    isCurrentUser: false,
                },
                { userId: 'me', name: 'Utkarsh', amount: 1000, isCurrentUser: true },
            ],
            spendingByMonth: [
                { month: '2026-07', amount: 1000, actualPaid: 800, currentUserShare: 400 },
                { month: '2026-08', amount: 2000, actualPaid: 2000, currentUserShare: 600 },
            ],
        },
        {
            groupId: 'empty',
            name: 'Empty home',
            amount: 0,
            actualPaid: 0,
            currentUserShare: 0,
            currentBalance: 250,
            memberShares: [{ userId: 'me', name: 'Utkarsh', amount: 0, isCurrentUser: true }],
            spendingByMonth: [],
        },
    ],
};

function renderPage(data: DashboardSummary = dashboard) {
    vi.mocked(useDashboard).mockReturnValue({
        data,
        isLoading: false,
        isError: false,
        refetch: vi.fn(),
    } as unknown as ReturnType<typeof useDashboard>);
    return render(
        <MemoryRouter>
            <DashboardPage />
        </MemoryRouter>,
    );
}

describe('DashboardPage', () => {
    beforeEach(() => vi.mocked(useDashboard).mockReset());

    it('does not show false zeroes while loading', () => {
        vi.mocked(useDashboard).mockReturnValue({ isLoading: true } as ReturnType<
            typeof useDashboard
        >);
        render(
            <MemoryRouter>
                <DashboardPage />
            </MemoryRouter>,
        );
        expect(screen.getByRole('status', { name: /loading dashboard/i })).toBeInTheDocument();
        expect(screen.queryByText(/₹0/)).not.toBeInTheDocument();
    });

    it('shows a retryable, non-destructive error', () => {
        const refetch = vi.fn();
        vi.mocked(useDashboard).mockReturnValue({
            isError: true,
            isLoading: false,
            refetch,
        } as unknown as ReturnType<typeof useDashboard>);
        render(
            <MemoryRouter>
                <DashboardPage />
            </MemoryRouter>,
        );
        expect(screen.getByText(/expenses have not been changed/i)).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: /retry/i }));
        expect(refetch).toHaveBeenCalled();
    });

    it('renders the all-groups scope with gross balances and paired metrics', () => {
        renderPage();
        expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
        expect(screen.getByText(/to receive ₹250.00/i)).toBeInTheDocument();
        expect(screen.getByText(/to pay ₹125.00/i)).toBeInTheDocument();
        expect(screen.getAllByText('Paid by you').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Your share').length).toBeGreaterThan(0);
        expect(
            screen.getByLabelText(/paid by you ₹2,800.00; your share ₹1,000.00/i),
        ).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: /spending over time/i })).toBeInTheDocument();
        expect(screen.getByRole('table', { name: /monthly spending values/i })).toBeInTheDocument();
    });

    it('switches to a selected group and ranks participant shares', () => {
        renderPage();
        fireEvent.click(screen.getByRole('button', { name: /view:.*all groups/i }));
        fireEvent.click(screen.getByRole('button', { name: 'A very long Goa trip group name' }));
        expect(screen.getAllByText('Total group spending').length).toBeGreaterThan(0);
        expect(screen.getByText(/A participant with a very long name/)).toBeInTheDocument();
        expect(screen.getByText(/Utkarsh \(You\)/)).toBeInTheDocument();
        expect(screen.getByText('66.7%')).toBeInTheDocument();
    });

    it('filters the group scope options by name', () => {
        renderPage();
        fireEvent.click(screen.getByRole('button', { name: /view:.*all groups/i }));
        fireEvent.change(screen.getByRole('searchbox', { name: /search groups/i }), {
            target: { value: 'empty' },
        });
        expect(screen.getByRole('button', { name: 'Empty home' })).toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: 'A very long Goa trip group name' }),
        ).not.toBeInTheDocument();
    });

    it('renders groups-without-expenses and no-groups states', () => {
        const { unmount } = renderPage({
            actualPaid: 0,
            currentUserShare: 0,
            groupSpend: [dashboard.groupSpend[1]!],
        });
        expect(screen.getByText('Your groups are ready')).toBeInTheDocument();
        unmount();
        renderPage({ actualPaid: 0, currentUserShare: 0, groupSpend: [] });
        expect(screen.getByText('No shared spending yet')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /create a group/i })).toHaveAttribute(
            'href',
            '/groups',
        );
    });

    it('does not render a comparison chart for one group', () => {
        renderPage({
            actualPaid: 2800,
            currentUserShare: 1000,
            groupSpend: [dashboard.groupSpend[0]!],
        });
        expect(screen.queryByRole('img')).not.toBeInTheDocument();
        expect(screen.getAllByText('Paid by you').length).toBeGreaterThan(0);
    });
});

describe('contributionCopy', () => {
    it.each([
        [200, 100, 'more than'],
        [100, 200, 'less than'],
        [100, 100, 'matches your share'],
    ])('describes contribution differences', (paid, share, copy) =>
        expect(contributionCopy(paid as number, share as number)).toContain(copy),
    );
});

describe('comparisonScale', () => {
    it('defines an independent axis from each group values', () => {
        expect(comparisonScale(100_000, 50_000)).toBe(100_000);
        expect(comparisonScale(100, 275)).toBe(275);
        expect(comparisonScale(0, 0)).toBe(1);
    });
});
