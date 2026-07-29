import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import type { Expense, Group, User } from '@data/entities';
import { CURRENT_USER_ID } from '@data/seed';
import { useExpense } from '@features/expenses/hooks/useExpense';
import { useGroup, useGroupMembers } from '@features/groups';
import { ExpenseDetailPage } from './ExpenseDetailPage';

vi.mock('react-router', async () => {
    const actual = await vi.importActual('react-router');
    return { ...actual, useParams: () => ({ groupId: 'group-1', expenseId: 'expense-1' }) };
});

vi.mock('@features/groups', () => ({
    useGroup: vi.fn(),
    useGroupMembers: vi.fn(),
}));

vi.mock('@features/expenses/hooks/useExpense', () => ({
    useExpense: vi.fn(),
}));

const group: Group = {
    id: 'group-1',
    name: 'Daaru Party',
    memberIds: [CURRENT_USER_ID, 'friend-1', 'friend-2'],
    createdAt: '',
};

const members: User[] = [
    { id: CURRENT_USER_ID, name: 'Utkarsh Srivastava', email: 'utkarsh@example.com' },
    { id: 'friend-1', name: 'Abhinav', email: 'abhinav@example.com' },
    { id: 'friend-2', name: 'Khem', email: 'khem@example.com' },
];

const expense: Expense = {
    id: 'expense-1',
    groupId: 'group-1',
    description: 'Chicken',
    amount: 90,
    paidByUserId: CURRENT_USER_ID,
    splitType: 'equal',
    splits: [
        { userId: CURRENT_USER_ID, amount: 45 },
        { userId: 'friend-1', amount: 45 },
    ],
    createdAt: '2026-07-24T00:00:00.000Z',
};

function renderPage() {
    return render(
        <MemoryRouter>
            <ExpenseDetailPage />
        </MemoryRouter>,
    );
}

describe('ExpenseDetailPage', () => {
    it('shows a loading message while fetching', () => {
        vi.mocked(useExpense).mockReturnValue({
            data: undefined,
            isLoading: true,
            isError: false,
        } as unknown as ReturnType<typeof useExpense>);
        vi.mocked(useGroup).mockReturnValue({
            data: undefined,
            isLoading: true,
        } as unknown as ReturnType<typeof useGroup>);
        vi.mocked(useGroupMembers).mockReturnValue({
            data: [],
            isLoading: true,
        } as unknown as ReturnType<typeof useGroupMembers>);

        renderPage();

        expect(screen.getByRole('status', { name: /loading expense/i })).toBeInTheDocument();
    });

    it('shows an error message when the expense fails to load', () => {
        vi.mocked(useExpense).mockReturnValue({
            data: undefined,
            isLoading: false,
            isError: true,
        } as unknown as ReturnType<typeof useExpense>);
        vi.mocked(useGroup).mockReturnValue({
            data: group,
            isLoading: false,
        } as unknown as ReturnType<typeof useGroup>);
        vi.mocked(useGroupMembers).mockReturnValue({
            data: members,
            isLoading: false,
        } as unknown as ReturnType<typeof useGroupMembers>);

        renderPage();

        expect(screen.getByText(/couldn't load this expense/i)).toBeInTheDocument();
    });

    it('renders the back link and expense title once loaded', () => {
        vi.mocked(useExpense).mockReturnValue({
            data: expense,
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useExpense>);
        vi.mocked(useGroup).mockReturnValue({
            data: group,
            isLoading: false,
        } as unknown as ReturnType<typeof useGroup>);
        vi.mocked(useGroupMembers).mockReturnValue({
            data: members,
            isLoading: false,
        } as unknown as ReturnType<typeof useGroupMembers>);

        renderPage();

        expect(screen.getByRole('link', { name: /back to group/i })).toHaveAttribute(
            'href',
            '/groups/group-1',
        );
        expect(screen.getByRole('heading', { name: 'Chicken' })).toBeInTheDocument();
    });

    it('shows the amount and who added the expense, with the added date', () => {
        vi.mocked(useExpense).mockReturnValue({
            data: expense,
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useExpense>);
        vi.mocked(useGroup).mockReturnValue({
            data: group,
            isLoading: false,
        } as unknown as ReturnType<typeof useGroup>);
        vi.mocked(useGroupMembers).mockReturnValue({
            data: members,
            isLoading: false,
        } as unknown as ReturnType<typeof useGroupMembers>);

        renderPage();

        expect(screen.getByText('₹90.00')).toBeInTheDocument();
        expect(screen.getByText('Added by you on Jul 24, 2026')).toBeInTheDocument();
    });

    it('shows who paid, the amount, and the paid date as a heading above the split breakdown', () => {
        vi.mocked(useExpense).mockReturnValue({
            data: expense,
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useExpense>);
        vi.mocked(useGroup).mockReturnValue({
            data: group,
            isLoading: false,
        } as unknown as ReturnType<typeof useGroup>);
        vi.mocked(useGroupMembers).mockReturnValue({
            data: members,
            isLoading: false,
        } as unknown as ReturnType<typeof useGroupMembers>);

        renderPage();

        expect(screen.getByText('You paid ₹90.00')).toBeInTheDocument();
        expect(screen.getByText('on Jul 24, 2026')).toBeInTheDocument();
    });

    it('lists each participant with their share, omitting uninvolved members', () => {
        vi.mocked(useExpense).mockReturnValue({
            data: expense,
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useExpense>);
        vi.mocked(useGroup).mockReturnValue({
            data: group,
            isLoading: false,
        } as unknown as ReturnType<typeof useGroup>);
        vi.mocked(useGroupMembers).mockReturnValue({
            data: members,
            isLoading: false,
        } as unknown as ReturnType<typeof useGroupMembers>);

        renderPage();

        expect(screen.getByText('You owe ₹45.00')).toBeInTheDocument();
        expect(screen.getByText('Abhinav owes ₹45.00')).toBeInTheDocument();
        expect(screen.queryByText(/khem/i)).not.toBeInTheDocument();
    });

    it('renders a non-functional edit expense button', () => {
        vi.mocked(useExpense).mockReturnValue({
            data: expense,
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useExpense>);
        vi.mocked(useGroup).mockReturnValue({
            data: group,
            isLoading: false,
        } as unknown as ReturnType<typeof useGroup>);
        vi.mocked(useGroupMembers).mockReturnValue({
            data: members,
            isLoading: false,
        } as unknown as ReturnType<typeof useGroupMembers>);

        renderPage();

        expect(screen.getByRole('button', { name: /edit expense/i })).toBeInTheDocument();
    });

    it('renders a non-functional delete expense button', () => {
        vi.mocked(useExpense).mockReturnValue({
            data: expense,
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useExpense>);
        vi.mocked(useGroup).mockReturnValue({
            data: group,
            isLoading: false,
        } as unknown as ReturnType<typeof useGroup>);
        vi.mocked(useGroupMembers).mockReturnValue({
            data: members,
            isLoading: false,
        } as unknown as ReturnType<typeof useGroupMembers>);

        renderPage();

        expect(screen.getByRole('button', { name: /delete expense/i })).toBeInTheDocument();
    });
});
