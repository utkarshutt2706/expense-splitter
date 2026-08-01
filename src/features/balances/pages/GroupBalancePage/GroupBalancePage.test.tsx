import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Expense, Group, User } from '@data/entities';
import { CURRENT_USER_ID } from '@data/seed';
import { useExpenses } from '@features/expenses/hooks/useExpenses';
import { useGroup, useGroupMembers } from '@features/groups';
import { usePayments } from '@features/payments';
import { GroupBalancePage } from './GroupBalancePage';

vi.mock('react-router', async () => {
    const actual = await vi.importActual('react-router');
    return { ...actual, useParams: () => ({ groupId: 'group-1' }) };
});

vi.mock('@features/groups', () => ({
    useGroup: vi.fn(),
    useGroupMembers: vi.fn(),
}));

vi.mock('@features/expenses/hooks/useExpenses', () => ({
    useExpenses: vi.fn(),
}));

vi.mock('@features/payments', () => ({
    usePayments: vi.fn(),
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

const expenses: Expense[] = [
    {
        id: 'expense-1',
        groupId: 'group-1',
        description: 'Daaru',
        amount: 100,
        paidByUserId: CURRENT_USER_ID,
        splitType: 'equal',
        splits: [
            { userId: CURRENT_USER_ID, amount: 50 },
            { userId: 'friend-1', amount: 50 },
        ],
        createdAt: '2026-07-01T00:00:00.000Z',
    },
];

function renderPage() {
    return render(
        <MemoryRouter>
            <GroupBalancePage />
        </MemoryRouter>,
    );
}

describe('GroupBalancePage', () => {
    beforeEach(() => {
        vi.mocked(usePayments).mockReturnValue({
            data: [],
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof usePayments>);
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
        vi.mocked(useExpenses).mockReturnValue({
            data: [],
            isLoading: true,
            isError: false,
        } as unknown as ReturnType<typeof useExpenses>);

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
        vi.mocked(useExpenses).mockReturnValue({
            data: [],
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useExpenses>);

        renderPage();

        expect(screen.getByText(/couldn't load balances/i)).toBeInTheDocument();
    });

    it('shows an error message when expenses fail to load', () => {
        vi.mocked(useGroup).mockReturnValue({
            data: group,
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useGroup>);
        vi.mocked(useGroupMembers).mockReturnValue({
            data: members,
            isLoading: false,
        } as unknown as ReturnType<typeof useGroupMembers>);
        vi.mocked(useExpenses).mockReturnValue({
            data: undefined,
            isLoading: false,
            isError: true,
        } as unknown as ReturnType<typeof useExpenses>);

        renderPage();

        expect(screen.getByText(/couldn't load balances/i)).toBeInTheDocument();
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
        vi.mocked(useExpenses).mockReturnValue({
            data: [],
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useExpenses>);

        renderPage();

        expect(screen.getByRole('link', { name: /back to group/i })).toHaveAttribute(
            'href',
            '/groups/group-1',
        );
        expect(screen.getByRole('heading', { name: 'Daaru Party' })).toBeInTheDocument();
    });

    it('shows an error message when payments fail to load', () => {
        vi.mocked(useGroup).mockReturnValue({
            data: group,
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useGroup>);
        vi.mocked(useGroupMembers).mockReturnValue({
            data: members,
            isLoading: false,
        } as unknown as ReturnType<typeof useGroupMembers>);
        vi.mocked(useExpenses).mockReturnValue({
            data: [],
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useExpenses>);
        vi.mocked(usePayments).mockReturnValue({
            data: undefined,
            isLoading: false,
            isError: true,
        } as unknown as ReturnType<typeof usePayments>);

        renderPage();

        expect(screen.getByText(/couldn't load balances/i)).toBeInTheDocument();
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
        vi.mocked(useExpenses).mockReturnValue({
            data: expenses,
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useExpenses>);

        renderPage();

        const list = screen.getByTestId('group-balance-accordion-list');
        expect(list).toHaveTextContent('Utkarsh Srivastava');
        expect(list).toHaveTextContent('Abhinav');
    });
});
