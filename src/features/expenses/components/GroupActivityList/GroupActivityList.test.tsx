import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import type { Expense, Payment, User } from '@data/entities';
import { CURRENT_USER_ID } from '@data/seed';
import { useExpenses } from '@features/expenses/hooks/useExpenses';
import { usePayments } from '@features/payments';
import { GroupActivityList } from './GroupActivityList';

vi.mock('@features/expenses/hooks/useExpenses', () => ({
    useExpenses: vi.fn(),
}));

vi.mock('@features/payments', () => ({
    usePayments: vi.fn(),
}));

vi.mock('@app/hooks', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@app/hooks')>()),
    useCurrentUser: () => ({
        data: { id: CURRENT_USER_ID, name: 'Alex Morgan', email: 'alex@example.com' },
    }),
}));

const members: User[] = [
    { id: CURRENT_USER_ID, name: 'Alex Morgan', email: 'alex@example.com' },
    { id: 'friend-1', name: 'Priya Sharma', email: 'priya@example.com' },
];

function mockExpenses(data: Expense[] | undefined, overrides: Record<string, unknown> = {}) {
    vi.mocked(useExpenses).mockReturnValue({
        data,
        isLoading: false,
        isError: false,
        ...overrides,
    } as unknown as ReturnType<typeof useExpenses>);
}

function mockPayments(data: Payment[] | undefined, overrides: Record<string, unknown> = {}) {
    vi.mocked(usePayments).mockReturnValue({
        data,
        isLoading: false,
        isError: false,
        ...overrides,
    } as unknown as ReturnType<typeof usePayments>);
}

function renderList(isMembersLoading = false) {
    return render(
        <MemoryRouter>
            <GroupActivityList
                groupId="group-1"
                members={members}
                isMembersLoading={isMembersLoading}
            />
        </MemoryRouter>,
    );
}

describe('GroupActivityList', () => {
    it('shows a loading skeleton while expenses are fetching', () => {
        mockExpenses([], { isLoading: true });
        mockPayments([]);

        renderList();

        expect(screen.getByRole('status', { name: /loading activity/i })).toBeInTheDocument();
    });

    it('shows a loading skeleton while payments are fetching', () => {
        mockExpenses([]);
        mockPayments([], { isLoading: true });

        renderList();

        expect(screen.getByRole('status', { name: /loading activity/i })).toBeInTheDocument();
    });

    it('shows a loading skeleton while members are still loading', () => {
        mockExpenses([]);
        mockPayments([]);

        renderList(true);

        expect(screen.getByRole('status', { name: /loading activity/i })).toBeInTheDocument();
    });

    it('shows an error message when expenses fail to load', () => {
        mockExpenses(undefined, { isError: true });
        mockPayments([]);

        renderList();

        expect(screen.getByText(/couldn't load activity/i)).toBeInTheDocument();
    });

    it('shows an error message when payments fail to load', () => {
        mockExpenses([]);
        mockPayments(undefined, { isError: true });

        renderList();

        expect(screen.getByText(/couldn't load activity/i)).toBeInTheDocument();
    });

    it('shows an empty message when there are no expenses or payments', () => {
        mockExpenses([]);
        mockPayments([]);

        renderList();

        expect(screen.getByText(/no activity yet/i)).toBeInTheDocument();
    });

    it('renders an expense row linking to its detail page', () => {
        mockExpenses([
            {
                id: 'expense-1',
                groupId: 'group-1',
                description: 'Groceries',
                amount: 42.5,
                paidByUserId: CURRENT_USER_ID,
                splitType: 'equal',
                splits: [
                    { userId: CURRENT_USER_ID, amount: 21.25 },
                    { userId: 'friend-1', amount: 21.25 },
                ],
                createdAt: '2026-07-02T00:00:00.000Z',
            },
        ]);
        mockPayments([]);

        renderList();

        const link = screen.getByRole('link', { name: /groceries/i });
        expect(link).toHaveAttribute('href', '/groups/group-1/expenses/expense-1');
        expect(screen.getByText(/you paid/i)).toBeInTheDocument();
        expect(screen.getByText(/you lent ₹21\.25/i)).toBeInTheDocument();
    });

    it('renders a payment row showing who paid whom, not as a link', () => {
        mockExpenses([]);
        mockPayments([
            {
                id: 'payment-1',
                groupId: 'group-1',
                fromUserId: CURRENT_USER_ID,
                toUserId: 'friend-1',
                amount: 25,
                createdAt: '2026-07-02T00:00:00.000Z',
            },
        ]);

        renderList();

        expect(screen.getByText('You paid Priya Sharma')).toBeInTheDocument();
        expect(screen.getByText('₹25.00')).toBeInTheDocument();
        expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });

    it('shows a refreshing indicator above the list during a background refetch', () => {
        mockExpenses(
            [
                {
                    id: 'expense-1',
                    groupId: 'group-1',
                    description: 'Groceries',
                    amount: 40,
                    paidByUserId: CURRENT_USER_ID,
                    splitType: 'equal',
                    splits: [{ userId: CURRENT_USER_ID, amount: 40 }],
                    createdAt: '2026-07-01T00:00:00.000Z',
                },
            ],
            { isFetching: true },
        );
        mockPayments([]);

        renderList();

        expect(screen.getByRole('status', { name: 'Refreshing…' })).toBeInTheDocument();
    });

    it('shows a refreshing indicator alongside the empty message during a background refetch', () => {
        mockExpenses([], { isFetching: true });
        mockPayments([]);

        renderList();

        expect(screen.getByText(/no activity yet/i)).toBeInTheDocument();
        expect(screen.getByRole('status', { name: 'Refreshing…' })).toBeInTheDocument();
    });

    it('does not show a refreshing indicator once the background refetch settles', () => {
        mockExpenses([]);
        mockPayments([]);

        renderList();

        expect(screen.queryByRole('status', { name: 'Refreshing…' })).not.toBeInTheDocument();
    });

    it('interleaves expenses and payments newest first', () => {
        mockExpenses([
            {
                id: 'expense-1',
                groupId: 'group-1',
                description: 'Groceries',
                amount: 40,
                paidByUserId: CURRENT_USER_ID,
                splitType: 'equal',
                splits: [
                    { userId: CURRENT_USER_ID, amount: 20 },
                    { userId: 'friend-1', amount: 20 },
                ],
                createdAt: '2026-07-01T00:00:00.000Z',
            },
        ]);
        mockPayments([
            {
                id: 'payment-1',
                groupId: 'group-1',
                fromUserId: CURRENT_USER_ID,
                toUserId: 'friend-1',
                amount: 20,
                createdAt: '2026-07-02T00:00:00.000Z',
            },
        ]);

        renderList();

        const rows = screen.getAllByText(/groceries|paid priya sharma/i);
        expect(rows[0]).toHaveTextContent('You paid Priya Sharma');
        expect(rows[1]).toHaveTextContent('Groceries');
    });
});
