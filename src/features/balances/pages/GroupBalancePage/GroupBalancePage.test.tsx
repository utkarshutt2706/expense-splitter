import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import type { Group, User } from '@data/entities';
import { CURRENT_USER_ID } from '@data/seed';
import type { GroupBalances } from '@features/balances/api/balancesApi';
import { useGroupBalances } from '@features/balances/hooks/useGroupBalances';
import { useGroup, useGroupMembers } from '@features/groups';
import { GroupBalancePage } from './GroupBalancePage';

vi.mock('react-router', async () => {
    const actual = await vi.importActual('react-router');
    return { ...actual, useParams: () => ({ groupId: 'group-1' }) };
});

vi.mock('@features/groups', () => ({
    useGroup: vi.fn(),
    useGroupMembers: vi.fn(),
}));

vi.mock('@features/balances/hooks/useGroupBalances', () => ({
    useGroupBalances: vi.fn(),
}));

vi.mock('../../components/GroupBalanceAccordionList', () => ({
    GroupBalanceAccordionList: ({ members }: { members: User[] }) => (
        <div data-testid="group-balance-accordion-list">
            {members.map((member) => member.name).join(',')}
        </div>
    ),
}));

const group: Group = {
    id: 'group-1',
    name: 'Daaru Party',
    memberIds: [CURRENT_USER_ID, 'friend-1'],
    createdAt: '',
};

const members: User[] = [
    { id: CURRENT_USER_ID, name: 'Utkarsh Srivastava', email: 'utkarsh@example.com' },
    { id: 'friend-1', name: 'Abhinav', email: 'abhinav@example.com' },
];

const groupBalances: GroupBalances = {
    balances: [
        { userId: CURRENT_USER_ID, balance: 50 },
        { userId: 'friend-1', balance: -50 },
    ],
    settlements: [{ fromUserId: 'friend-1', toUserId: CURRENT_USER_ID, amount: 50 }],
};

function renderPage() {
    return render(
        <MemoryRouter>
            <GroupBalancePage />
        </MemoryRouter>,
    );
}

describe('GroupBalancePage', () => {
    it('shows a loading message while fetching', () => {
        vi.mocked(useGroup).mockReturnValue({
            data: undefined,
            isLoading: true,
            isError: false,
        } as unknown as ReturnType<typeof useGroup>);
        vi.mocked(useGroupMembers).mockReturnValue({
            data: [],
            isLoading: true,
        } as unknown as ReturnType<typeof useGroupMembers>);
        vi.mocked(useGroupBalances).mockReturnValue({
            data: undefined,
            isLoading: true,
            isError: false,
        } as unknown as ReturnType<typeof useGroupBalances>);

        renderPage();

        expect(screen.getByRole('status', { name: /loading balances/i })).toBeInTheDocument();
    });

    it('shows an error message when the group fails to load', () => {
        vi.mocked(useGroup).mockReturnValue({
            data: undefined,
            isLoading: false,
            isError: true,
        } as unknown as ReturnType<typeof useGroup>);
        vi.mocked(useGroupMembers).mockReturnValue({
            data: [],
            isLoading: false,
        } as unknown as ReturnType<typeof useGroupMembers>);
        vi.mocked(useGroupBalances).mockReturnValue({
            data: undefined,
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useGroupBalances>);

        renderPage();

        expect(screen.getByText(/we couldn’t load the group balances/i)).toBeInTheDocument();
    });

    it('shows an error message when balances fail to load', () => {
        vi.mocked(useGroup).mockReturnValue({
            data: group,
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useGroup>);
        vi.mocked(useGroupMembers).mockReturnValue({
            data: members,
            isLoading: false,
        } as unknown as ReturnType<typeof useGroupMembers>);
        vi.mocked(useGroupBalances).mockReturnValue({
            data: undefined,
            isLoading: false,
            isError: true,
        } as unknown as ReturnType<typeof useGroupBalances>);

        renderPage();

        expect(screen.getByText(/we couldn’t load the group balances/i)).toBeInTheDocument();
    });

    it('renders the back link and group name once loaded', () => {
        vi.mocked(useGroup).mockReturnValue({
            data: group,
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useGroup>);
        vi.mocked(useGroupMembers).mockReturnValue({
            data: members,
            isLoading: false,
        } as unknown as ReturnType<typeof useGroupMembers>);
        vi.mocked(useGroupBalances).mockReturnValue({
            data: { balances: [], settlements: [] },
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useGroupBalances>);

        renderPage();

        expect(screen.getByRole('link', { name: /back to group/i })).toHaveAttribute(
            'href',
            '/groups/group-1',
        );
        expect(screen.getByRole('heading', { name: 'Balances' })).toBeInTheDocument();
        expect(screen.getByText('Daaru Party')).toBeInTheDocument();
    });

    it('includes every member, including the current user, in the accordion list', () => {
        vi.mocked(useGroup).mockReturnValue({
            data: group,
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useGroup>);
        vi.mocked(useGroupMembers).mockReturnValue({
            data: members,
            isLoading: false,
        } as unknown as ReturnType<typeof useGroupMembers>);
        vi.mocked(useGroupBalances).mockReturnValue({
            data: groupBalances,
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useGroupBalances>);

        renderPage();

        const list = screen.getByTestId('group-balance-accordion-list');
        expect(list).toHaveTextContent('Utkarsh Srivastava');
        expect(list).toHaveTextContent('Abhinav');
    });

    it('shows a refreshing indicator during a background refetch, not the loading skeleton', () => {
        vi.mocked(useGroup).mockReturnValue({
            data: group,
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useGroup>);
        vi.mocked(useGroupMembers).mockReturnValue({
            data: members,
            isLoading: false,
        } as unknown as ReturnType<typeof useGroupMembers>);
        vi.mocked(useGroupBalances).mockReturnValue({
            data: groupBalances,
            isLoading: false,
            isFetching: true,
            isError: false,
        } as unknown as ReturnType<typeof useGroupBalances>);

        renderPage();

        expect(screen.getByRole('status', { name: 'Refreshing…' })).toBeInTheDocument();
        expect(screen.queryByRole('status', { name: /loading balances/i })).not.toBeInTheDocument();
    });

    it('does not show a refreshing indicator once the background refetch settles', () => {
        vi.mocked(useGroup).mockReturnValue({
            data: group,
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useGroup>);
        vi.mocked(useGroupMembers).mockReturnValue({
            data: members,
            isLoading: false,
        } as unknown as ReturnType<typeof useGroupMembers>);
        vi.mocked(useGroupBalances).mockReturnValue({
            data: groupBalances,
            isLoading: false,
            isFetching: false,
            isError: false,
        } as unknown as ReturnType<typeof useGroupBalances>);

        renderPage();

        expect(screen.queryByRole('status', { name: 'Refreshing…' })).not.toBeInTheDocument();
    });
});
