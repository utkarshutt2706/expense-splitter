import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useDashboard } from '@features/dashboard/hooks';
import { DashboardPage } from './DashboardPage';

vi.mock('@features/dashboard/hooks', () => ({ useDashboard: vi.fn() }));

function renderPage() {
    return render(
        <MemoryRouter>
            <DashboardPage />
        </MemoryRouter>,
    );
}

describe('DashboardPage', () => {
    beforeEach(() => {
        vi.mocked(useDashboard).mockReset();
    });

    it('shows a loading skeleton', () => {
        vi.mocked(useDashboard).mockReturnValue({
            isLoading: true,
            isError: false,
        } as unknown as ReturnType<typeof useDashboard>);

        renderPage();

        expect(screen.getByRole('status', { name: /loading dashboard/i })).toBeInTheDocument();
    });

    it('shows an error state', () => {
        vi.mocked(useDashboard).mockReturnValue({
            isLoading: false,
            isError: true,
        } as unknown as ReturnType<typeof useDashboard>);

        renderPage();

        expect(screen.getByText(/couldn't load your dashboard/i)).toBeInTheDocument();
    });

    it('guides users without expenses to their groups', () => {
        vi.mocked(useDashboard).mockReturnValue({
            isLoading: false,
            isError: false,
            data: { actualPaid: 0, currentUserShare: 0, memberShares: [], groupSpend: [] },
        } as unknown as ReturnType<typeof useDashboard>);

        renderPage();

        expect(screen.getByText(/your dashboard is ready/i)).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /view groups/i })).toHaveAttribute(
            'href',
            '/groups',
        );
    });

    it('renders payment totals, per-head shares, and group spending', () => {
        vi.mocked(useDashboard).mockReturnValue({
            isLoading: false,
            isError: false,
            data: {
                actualPaid: 3200,
                currentUserShare: 1250,
                memberShares: [
                    { userId: 'me', name: 'Utkarsh', amount: 1250, isCurrentUser: true },
                    { userId: 'friend', name: 'Asha', amount: 1950, isCurrentUser: false },
                ],
                groupSpend: [
                    { groupId: 'trip', name: 'Goa trip', amount: 3000 },
                    { groupId: 'home', name: 'Home', amount: 200 },
                ],
            },
        } as unknown as ReturnType<typeof useDashboard>);

        renderPage();

        expect(screen.getByText('Actually paid by you')).toBeInTheDocument();
        expect(screen.getByText('Your fair share')).toBeInTheDocument();
        expect(screen.getByRole('img', { name: /per-head share chart/i })).toBeInTheDocument();
        expect(screen.getByText('You')).toBeInTheDocument();
        expect(screen.getByText('Asha')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Goa trip' })).toHaveAttribute(
            'href',
            '/groups/trip',
        );
        expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/groups/home');
        expect(screen.getAllByText('₹3,200.00')).toHaveLength(2);
        expect(screen.getAllByText('₹1,250.00')).toHaveLength(2);
    });
});
