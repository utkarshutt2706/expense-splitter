import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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

function groupBalances(
    balances: MemberBalance[],
    settlements: GroupBalances['settlements'] = [],
): GroupBalances {
    return { balances, settlements };
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
    beforeEach(() => {
        window.sessionStorage.clear();
        vi.spyOn(window, 'matchMedia').mockImplementation(
            (query) =>
                ({
                    matches: false,
                    media: query,
                    onchange: null,
                    addListener: vi.fn(),
                    removeListener: vi.fn(),
                    addEventListener: vi.fn(),
                    removeEventListener: vi.fn(),
                    dispatchEvent: vi.fn(),
                }) as MediaQueryList,
        );
    });

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

        expect(screen.getByText('Balance unavailable')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });

    it('renders an owed balance as one explicit link surface to the balance page', () => {
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
        expect(screen.queryByText(/click to view details/i)).not.toBeInTheDocument();

        const link = screen.getByRole('link', { name: /you are owed.*view balances/i });
        expect(link).toHaveAttribute('href', '/groups/group-1/balance');
        expect(link.querySelectorAll('a, button')).toHaveLength(0);
    });

    it('renders an amount owed as one explicit link surface to the balance page', () => {
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

        const link = screen.getByRole('link', { name: /you owe.*view balances/i });
        expect(link).toHaveAttribute('href', '/groups/group-1/balance');
    });

    it('shows a non-interactive group-wide settled state and celebrates once', () => {
        vi.mocked(useGroupBalances).mockReturnValue({
            data: groupBalances([
                { userId: CURRENT_USER_ID, balance: 0 },
                { userId: 'friend-1', balance: 0 },
            ]),
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useGroupBalances>);

        renderSummary();

        expect(screen.getByText('Everyone is settled up')).toHaveClass('text-settled');
        expect(screen.getByText('No outstanding balances in this group')).toBeInTheDocument();
        expect(screen.getByTestId('group-settlement-confetti')).toHaveAttribute(
            'aria-hidden',
            'true',
        );
        expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });

    it('shows personal settlement with a balance link and celebrates once', () => {
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

        expect(screen.getByText('You are settled up')).toHaveClass('text-settled');
        expect(screen.getByTestId('personal-settlement-confetti')).toBeInTheDocument();

        const link = screen.getByRole('link', { name: /you are settled up.*view balances/i });
        expect(link).toHaveAttribute('href', '/groups/group-1/balance');
        expect(screen.queryByText(/everyone is settled/i)).not.toBeInTheDocument();
    });

    it('does not celebrate again when revisiting the same settled group in the session', () => {
        vi.mocked(useGroupBalances).mockReturnValue({
            data: groupBalances([
                { userId: CURRENT_USER_ID, balance: 0 },
                { userId: 'friend-1', balance: 0 },
            ]),
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useGroupBalances>);

        const firstVisit = renderSummary();
        expect(screen.getByTestId('group-settlement-confetti')).toBeInTheDocument();
        firstVisit.unmount();
        renderSummary();

        expect(screen.queryByTestId('group-settlement-confetti')).not.toBeInTheDocument();
    });

    it('does not celebrate again when the same settled state re-renders', () => {
        vi.mocked(useGroupBalances).mockReturnValue({
            data: groupBalances([
                { userId: CURRENT_USER_ID, balance: 0 },
                { userId: 'friend-1', balance: -50 },
                { userId: 'friend-2', balance: 50 },
            ]),
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useGroupBalances>);
        const members = [
            ...defaultMembers,
            { id: 'friend-2', name: 'Khem', email: 'khem@example.com' },
        ];

        const { rerender } = renderSummary(members);
        rerender(
            <MemoryRouter>
                <GroupBalanceSummary groupId="group-1" members={members} />
            </MemoryRouter>,
        );

        expect(screen.getAllByTestId('personal-settlement-confetti')).toHaveLength(1);
    });

    it('celebrates when balance data transitions from outstanding to settled', () => {
        vi.mocked(useGroupBalances).mockReturnValue({
            data: groupBalances([
                { userId: CURRENT_USER_ID, balance: -50 },
                { userId: 'friend-1', balance: 50 },
            ]),
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useGroupBalances>);
        const view = renderSummary();
        expect(screen.queryByTestId('group-settlement-confetti')).not.toBeInTheDocument();

        vi.mocked(useGroupBalances).mockReturnValue({
            data: groupBalances([
                { userId: CURRENT_USER_ID, balance: 0 },
                { userId: 'friend-1', balance: 0 },
            ]),
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useGroupBalances>);
        view.rerender(
            <MemoryRouter>
                <GroupBalanceSummary groupId="group-1" members={defaultMembers} />
            </MemoryRouter>,
        );

        expect(screen.getByText('Everyone is settled up')).toBeInTheDocument();
        expect(screen.getByTestId('group-settlement-confetti')).toBeInTheDocument();
    });

    it('respects reduced-motion preferences', () => {
        vi.mocked(window.matchMedia).mockImplementation(
            (query) => ({ matches: true, media: query }) as MediaQueryList,
        );
        vi.mocked(useGroupBalances).mockReturnValue({
            data: groupBalances([
                { userId: CURRENT_USER_ID, balance: 0 },
                { userId: 'friend-1', balance: 0 },
            ]),
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useGroupBalances>);

        renderSummary();

        expect(screen.queryByTestId('group-settlement-confetti')).not.toBeInTheDocument();
        expect(screen.getByText('Everyone is settled up')).toBeInTheDocument();
    });

    it('shows gross receive and pay obligations for a mixed position', () => {
        vi.mocked(useGroupBalances).mockReturnValue({
            data: groupBalances(
                [
                    { userId: CURRENT_USER_ID, balance: 3500 },
                    { userId: 'friend-1', balance: -3500 },
                ],
                [
                    { fromUserId: 'friend-1', toUserId: CURRENT_USER_ID, amount: 5000 },
                    { fromUserId: CURRENT_USER_ID, toUserId: 'friend-2', amount: 1500 },
                ],
            ),
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useGroupBalances>);

        renderSummary();

        expect(screen.getByText('To receive ₹5,000.00')).toHaveClass('text-owed');
        expect(screen.getByText('To pay ₹1,500.00')).toHaveClass('text-owe');
        expect(screen.getByRole('link', { name: /view balances/i })).toHaveAttribute(
            'href',
            '/groups/group-1/balance',
        );
    });

    it('shows a non-actionable no-activity state', () => {
        vi.mocked(useGroupBalances).mockReturnValue({
            data: groupBalances([]),
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useGroupBalances>);

        renderSummary();

        expect(screen.getByText('No balances yet')).toBeInTheDocument();
        expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });

    it('shows a refreshing indicator during a background refetch, not the loading skeleton', () => {
        vi.mocked(useGroupBalances).mockReturnValue({
            data: groupBalances([
                { userId: CURRENT_USER_ID, balance: 50 },
                { userId: 'friend-1', balance: -50 },
            ]),
            isLoading: false,
            isFetching: true,
            isError: false,
        } as unknown as ReturnType<typeof useGroupBalances>);

        const { container } = renderSummary();

        expect(screen.getByRole('status', { name: 'Refreshing…' })).toBeInTheDocument();
        expect(screen.getByText('View balances').parentElement?.parentElement).toContainElement(
            screen.getByRole('status', { name: 'Refreshing…' }),
        );
        expect(container.querySelector('.animate-pulse')).not.toBeInTheDocument();
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
