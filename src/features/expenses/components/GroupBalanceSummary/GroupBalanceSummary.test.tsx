import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import type { User } from '@data/entities';
import { CURRENT_USER_ID } from '@data/seed';
import type { GroupBalances, MemberBalance } from '@features/balances/api/balancesApi';
import { useGroupBalances } from '@features/balances/hooks/useGroupBalances';
import { GroupBalanceSummary } from './GroupBalanceSummary';

vi.mock('@features/balances/hooks/useGroupBalances', () => ({
    useGroupBalances: vi.fn(),
}));

vi.mock('@app/hooks', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@app/hooks')>()),
    useCurrentUser: () => ({
        data: { id: CURRENT_USER_ID, name: 'Alex Morgan', email: 'alex@example.com' },
    }),
}));

function groupBalances(balances: MemberBalance[]): GroupBalances {
    return { balances, settlements: [] };
}

const defaultMembers: User[] = [
    { id: CURRENT_USER_ID, name: 'Alex Morgan', email: 'alex@example.com' },
    { id: 'friend-1', name: 'Priya Sharma', email: 'priya@example.com' },
];

function renderSummary(members: User[] = defaultMembers) {
    return render(
        <MemoryRouter>
            <GroupBalanceSummary groupId="group-1" members={members} />
        </MemoryRouter>,
    );
}

describe('GroupBalanceSummary', () => {
    it('shows a loading skeleton while fetching', () => {
        vi.mocked(useGroupBalances).mockReturnValue({
            data: undefined,
            isLoading: true,
            isError: false,
        } as unknown as ReturnType<typeof useGroupBalances>);

        const { container } = renderSummary();

        expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
    });

    it('shows an error message when balances fail to load', () => {
        vi.mocked(useGroupBalances).mockReturnValue({
            data: undefined,
            isLoading: false,
            isError: true,
        } as unknown as ReturnType<typeof useGroupBalances>);

        renderSummary();

        expect(screen.getByText(/couldn't load balance/i)).toBeInTheDocument();
    });

    it('shows "you are owed" in the owed color, with a neutral link to the balance page', () => {
        vi.mocked(useGroupBalances).mockReturnValue({
            data: groupBalances([
                { userId: CURRENT_USER_ID, balance: 50 },
                { userId: 'friend-1', balance: -50 },
            ]),
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useGroupBalances>);

        renderSummary();

        expect(screen.getByText(/you are owed ₹50\.00/i)).toHaveClass('text-owed');

        const link = screen.getByRole('link', { name: /click to view details/i });
        expect(link).toHaveAttribute('href', '/groups/group-1/balance');
        expect(link).not.toHaveClass('text-owed');
    });

    it('shows "you owe" in the owe color, with a neutral link to the balance page', () => {
        vi.mocked(useGroupBalances).mockReturnValue({
            data: groupBalances([
                { userId: CURRENT_USER_ID, balance: -50 },
                { userId: 'friend-1', balance: 50 },
            ]),
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useGroupBalances>);

        renderSummary();

        expect(screen.getByText(/you owe ₹50\.00/i)).toHaveClass('text-owe');

        const link = screen.getByRole('link', { name: /click to view details/i });
        expect(link).not.toHaveClass('text-owe');
    });

    it('shows a settled message and a celebratory note instead of a link when the whole group is settled', () => {
        vi.mocked(useGroupBalances).mockReturnValue({
            data: groupBalances([
                { userId: CURRENT_USER_ID, balance: 0 },
                { userId: 'friend-1', balance: 0 },
            ]),
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useGroupBalances>);

        renderSummary();

        // Showing both "You're all settled up" and the celebratory note would say
        // the same thing twice, so only the celebratory note should render.
        expect(screen.queryByText(/you're all settled up/i)).not.toBeInTheDocument();
        expect(screen.getByText(/this group is all settled/i)).toHaveClass('text-settled');
        expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });

    it('still links to the balance page when the current user is settled but another member is not', () => {
        vi.mocked(useGroupBalances).mockReturnValue({
            data: groupBalances([
                { userId: CURRENT_USER_ID, balance: 0 },
                { userId: 'friend-1', balance: -50 },
                { userId: 'friend-2', balance: 50 },
            ]),
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useGroupBalances>);

        renderSummary([
            ...defaultMembers,
            { id: 'friend-2', name: 'Khem', email: 'khem@example.com' },
        ]);

        expect(screen.getByText(/all settled up/i)).toHaveClass('text-settled');

        const link = screen.getByRole('link', { name: /click to view details/i });
        expect(link).toHaveAttribute('href', '/groups/group-1/balance');
        expect(screen.queryByText(/this group is all settled/i)).not.toBeInTheDocument();
    });

    it('shows a refreshing indicator during a background refetch, not the loading skeleton', () => {
        vi.mocked(useGroupBalances).mockReturnValue({
            data: groupBalances([]),
            isLoading: false,
            isFetching: true,
            isError: false,
        } as unknown as ReturnType<typeof useGroupBalances>);

        const { container } = renderSummary();

        expect(screen.getByRole('status', { name: 'Refreshing…' })).toBeInTheDocument();
        expect(container.querySelector('[aria-hidden="true"]')).not.toBeInTheDocument();
    });

    it('does not show a refreshing indicator once the background refetch settles', () => {
        vi.mocked(useGroupBalances).mockReturnValue({
            data: groupBalances([]),
            isLoading: false,
            isFetching: false,
            isError: false,
        } as unknown as ReturnType<typeof useGroupBalances>);

        renderSummary();

        expect(screen.queryByRole('status', { name: 'Refreshing…' })).not.toBeInTheDocument();
    });
});
