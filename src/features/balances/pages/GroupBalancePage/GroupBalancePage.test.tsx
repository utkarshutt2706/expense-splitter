import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Group } from '@features/groups/api/groupsApi';
import type { User } from '@features/users/api/usersApi';
import { CURRENT_USER_ID } from '@test/fixtures/ids';
import type { GroupBalances } from '@features/balances/api/balancesApi';
import { useGroupBalances } from '@features/balances/hooks/useGroupBalances';
import { useGroup, useGroupMembers } from '@features/groups';
import { GroupBalancePage } from './GroupBalancePage';

const route = vi.hoisted(() => ({ groupId: 'group-1' as string | undefined }));
vi.mock('react-router', async () => {
    const actual = await vi.importActual('react-router');
    return { ...actual, useParams: () => ({ groupId: route.groupId }) };
});

vi.mock('@features/groups', () => ({
    useGroup: vi.fn(),
    useGroupMembers: vi.fn(),
}));

vi.mock('@features/balances/hooks/useGroupBalances', () => ({
    useGroupBalances: vi.fn(),
}));

vi.mock('../../components/GroupBalanceAccordionList', () => ({
    GroupBalanceAccordionList: ({
        groupId,
        members,
        netBalances,
        transactions,
    }: {
        groupId: string;
        members: User[];
        netBalances: Map<string, number>;
        transactions: GroupBalances['settlements'];
    }) => (
        <div
            data-testid="group-balance-accordion-list"
            data-group-id={groupId}
            data-balances={JSON.stringify([...netBalances])}
            data-transactions={JSON.stringify(transactions)}
        >
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
    beforeEach(() => {
        route.groupId = 'group-1';
    });

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

    it.each(['members', 'balances'] as const)(
        'keeps the initial skeleton visible while %s are loading',
        (source) => {
            vi.mocked(useGroup).mockReturnValue({
                data: group,
                isLoading: false,
                isError: false,
            } as unknown as ReturnType<typeof useGroup>);
            vi.mocked(useGroupMembers).mockReturnValue({
                data: members,
                isLoading: source === 'members',
                isError: false,
            } as unknown as ReturnType<typeof useGroupMembers>);
            vi.mocked(useGroupBalances).mockReturnValue({
                data: groupBalances,
                isLoading: source === 'balances',
                isError: false,
            } as unknown as ReturnType<typeof useGroupBalances>);

            renderPage();

            expect(screen.getByRole('status', { name: /loading balances/i })).toBeInTheDocument();
            expect(screen.queryByRole('status', { name: 'Refreshing…' })).not.toBeInTheDocument();
        },
    );

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

    it('shows the same recoverable error when members fail or the group data is absent', () => {
        vi.mocked(useGroup).mockReturnValue({
            data: undefined,
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useGroup>);
        vi.mocked(useGroupMembers).mockReturnValue({
            data: undefined,
            isLoading: false,
            isError: true,
        } as unknown as ReturnType<typeof useGroupMembers>);
        vi.mocked(useGroupBalances).mockReturnValue({
            data: undefined,
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useGroupBalances>);

        renderPage();

        expect(screen.getByRole('alert')).toHaveTextContent('Nothing was changed. Try again.');
    });

    it('retries the group, members, and balances requests together', () => {
        const refetchGroup = vi.fn();
        const refetchMembers = vi.fn();
        const refetchBalances = vi.fn();
        vi.mocked(useGroup).mockReturnValue({
            data: undefined,
            isLoading: false,
            isError: true,
            refetch: refetchGroup,
        } as unknown as ReturnType<typeof useGroup>);
        vi.mocked(useGroupMembers).mockReturnValue({
            data: [],
            isLoading: false,
            isError: false,
            refetch: refetchMembers,
        } as unknown as ReturnType<typeof useGroupMembers>);
        vi.mocked(useGroupBalances).mockReturnValue({
            data: undefined,
            isLoading: false,
            isError: false,
            refetch: refetchBalances,
        } as unknown as ReturnType<typeof useGroupBalances>);

        renderPage();
        fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

        expect(refetchGroup).toHaveBeenCalledOnce();
        expect(refetchMembers).toHaveBeenCalledOnce();
        expect(refetchBalances).toHaveBeenCalledOnce();
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
        expect(screen.getByRole('heading', { name: 'No balances yet' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Add expense' })).toHaveAttribute(
            'href',
            '/groups/group-1/expenses/new',
        );
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
        expect(list).toHaveAttribute(
            'data-balances',
            JSON.stringify([
                [CURRENT_USER_ID, 50],
                ['friend-1', -50],
            ]),
        );
        expect(list).toHaveAttribute(
            'data-transactions',
            JSON.stringify(groupBalances.settlements),
        );
    });

    it('renders balance activity even when member or balance collections are omitted', () => {
        vi.mocked(useGroup).mockReturnValue({
            data: group,
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useGroup>);
        vi.mocked(useGroupMembers).mockReturnValue({
            data: undefined,
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useGroupMembers>);
        vi.mocked(useGroupBalances).mockReturnValue({
            data: {
                balances: [],
                settlements: [{ fromUserId: 'former', toUserId: 'friend', amount: 5 }],
            },
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useGroupBalances>);

        renderPage();

        expect(screen.getByTestId('group-balance-accordion-list')).toBeEmptyDOMElement();
        expect(screen.queryByRole('heading', { name: 'No balances yet' })).not.toBeInTheDocument();
    });

    it('defaults all optional loaded collections safely when balance data is absent', () => {
        vi.mocked(useGroup).mockReturnValue({
            data: group,
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useGroup>);
        vi.mocked(useGroupMembers).mockReturnValue({
            data: undefined,
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useGroupMembers>);
        vi.mocked(useGroupBalances).mockReturnValue({
            data: undefined,
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useGroupBalances>);

        renderPage();

        expect(screen.getByRole('heading', { name: 'No balances yet' })).toBeInTheDocument();
    });

    it('uses empty identifiers in hooks and links when the route parameter is absent', () => {
        route.groupId = undefined;
        vi.mocked(useGroup).mockReturnValue({
            data: group,
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useGroup>);
        vi.mocked(useGroupMembers).mockReturnValue({
            data: members,
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useGroupMembers>);
        vi.mocked(useGroupBalances).mockReturnValue({
            data: groupBalances,
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useGroupBalances>);

        renderPage();

        expect(useGroup).toHaveBeenLastCalledWith('');
        expect(useGroupBalances).toHaveBeenLastCalledWith('');
        expect(screen.getByRole('link', { name: /back to group/i })).toHaveAttribute(
            'href',
            '/groups',
        );
        expect(screen.getByTestId('group-balance-accordion-list')).toHaveAttribute(
            'data-group-id',
            '',
        );
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

    it.each(['group', 'members'] as const)(
        'shows refreshing when the %s query refetches in the background',
        (source) => {
            vi.mocked(useGroup).mockReturnValue({
                data: group,
                isLoading: false,
                isFetching: source === 'group',
                isError: false,
            } as unknown as ReturnType<typeof useGroup>);
            vi.mocked(useGroupMembers).mockReturnValue({
                data: members,
                isLoading: false,
                isFetching: source === 'members',
                isError: false,
            } as unknown as ReturnType<typeof useGroupMembers>);
            vi.mocked(useGroupBalances).mockReturnValue({
                data: groupBalances,
                isLoading: false,
                isFetching: false,
                isError: false,
            } as unknown as ReturnType<typeof useGroupBalances>);

            renderPage();

            expect(screen.getByRole('status', { name: 'Refreshing…' })).toBeInTheDocument();
        },
    );

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
