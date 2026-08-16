import { fireEvent, render, screen } from '@testing-library/react';
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
                    {
                        groupId: 'trip',
                        name: 'Goa trip',
                        amount: 3000,
                        actualPaid: 2800,
                        currentUserShare: 1100,
                        memberShares: [
                            {
                                userId: 'friend',
                                name: 'Asha',
                                amount: 1900,
                                isCurrentUser: false,
                            },
                            {
                                userId: 'me',
                                name: 'Utkarsh',
                                amount: 1100,
                                isCurrentUser: true,
                            },
                        ],
                    },
                    {
                        groupId: 'home',
                        name: 'Home',
                        amount: 200,
                        actualPaid: 200,
                        currentUserShare: 150,
                        memberShares: [
                            {
                                userId: 'me',
                                name: 'Utkarsh',
                                amount: 150,
                                isCurrentUser: true,
                            },
                            {
                                userId: 'friend',
                                name: 'Asha',
                                amount: 50,
                                isCurrentUser: false,
                            },
                        ],
                    },
                ],
            },
        } as unknown as ReturnType<typeof useDashboard>);

        renderPage();

        expect(screen.getByText('Actually paid by you')).toBeInTheDocument();
        expect(screen.getByText('Your fair share')).toBeInTheDocument();
        expect(screen.getByText('Paid by you in Goa trip')).toBeInTheDocument();
        expect(screen.getByText('Your share in Goa trip')).toBeInTheDocument();
        expect(
            screen.getByRole('img', { name: /per-person share chart for goa trip/i }),
        ).toBeInTheDocument();
        expect(screen.getByText('You')).toBeInTheDocument();
        expect(screen.getByText('Asha')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Goa trip' })).toHaveAttribute(
            'href',
            '/groups/trip',
        );
        expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/groups/home');
        expect(screen.getByText('₹3,200.00')).toBeInTheDocument();
        expect(screen.getByText('₹1,250.00')).toBeInTheDocument();

        fireEvent.change(screen.getByLabelText(/group details/i), {
            target: { value: 'home' },
        });

        expect(screen.getByText('Paid by you in Home')).toBeInTheDocument();
        expect(screen.getByText('Your share in Home')).toBeInTheDocument();
        expect(
            screen.getByRole('img', { name: /per-person share chart for home/i }),
        ).toBeInTheDocument();
    });
});
