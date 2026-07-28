import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { Expense, User } from '@data/entities';
import { CURRENT_USER_ID } from '@data/seed';
import { useExpenses } from '@features/expenses/hooks/useExpenses';
import { ExpenseList } from './ExpenseList';

vi.mock('@features/expenses/hooks/useExpenses', () => ({
    useExpenses: vi.fn(),
}));

const members: User[] = [
    { id: CURRENT_USER_ID, name: 'Alex Morgan', email: 'alex@example.com' },
    { id: 'friend-1', name: 'Priya Sharma', email: 'priya@example.com' },
];

const expenses: Expense[] = [
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
        createdAt: '2026-07-01T00:00:00.000Z',
    },
    {
        id: 'expense-2',
        groupId: 'group-1',
        description: 'Taxi',
        amount: 20,
        paidByUserId: 'friend-1',
        splitType: 'equal',
        splits: [
            { userId: CURRENT_USER_ID, amount: 10 },
            { userId: 'friend-1', amount: 10 },
        ],
        createdAt: '2026-07-02T00:00:00.000Z',
    },
];

describe('ExpenseList', () => {
    it('shows a loading message while fetching', () => {
        vi.mocked(useExpenses).mockReturnValue({
            data: undefined,
            isLoading: true,
            isError: false,
        } as unknown as ReturnType<typeof useExpenses>);

        render(<ExpenseList groupId="group-1" members={members} />);

        expect(screen.getByRole('status', { name: /loading expenses/i })).toBeInTheDocument();
    });

    it('shows an error message when expenses fail to load', () => {
        vi.mocked(useExpenses).mockReturnValue({
            data: undefined,
            isLoading: false,
            isError: true,
        } as unknown as ReturnType<typeof useExpenses>);

        render(<ExpenseList groupId="group-1" members={members} />);

        expect(screen.getByText(/couldn't load expenses/i)).toBeInTheDocument();
    });

    it('shows an empty message when there are no expenses', () => {
        vi.mocked(useExpenses).mockReturnValue({
            data: [],
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useExpenses>);

        render(<ExpenseList groupId="group-1" members={members} />);

        expect(screen.getByText(/no expenses yet/i)).toBeInTheDocument();
    });

    it('renders each expense with description, amount, payer, and date', () => {
        vi.mocked(useExpenses).mockReturnValue({
            data: expenses,
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useExpenses>);

        render(<ExpenseList groupId="group-1" members={members} />);

        expect(screen.getByText('Groceries')).toBeInTheDocument();
        expect(screen.getByText('₹42.50')).toBeInTheDocument();
        expect(screen.getByText(/you paid · jul 1, 2026/i)).toBeInTheDocument();
        const lentText = screen.getByText('You lent ₹21.25');
        expect(lentText).toHaveClass('text-owed');

        expect(screen.getByText('Taxi')).toBeInTheDocument();
        expect(screen.getByText('₹20.00')).toBeInTheDocument();
        expect(screen.getByText(/priya sharma paid · jul 2, 2026/i)).toBeInTheDocument();
        const owedText = screen.getByText('You owe ₹10.00');
        expect(owedText).toHaveClass('text-owe');
    });

    it('shows "not involved" when the current user has no stake in the expense', () => {
        vi.mocked(useExpenses).mockReturnValue({
            data: [
                {
                    ...expenses[1]!,
                    splits: [{ userId: 'friend-1', amount: 20 }],
                },
            ],
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useExpenses>);

        render(<ExpenseList groupId="group-1" members={members} />);

        const notInvolvedText = screen.getByText('You were not involved');
        expect(notInvolvedText).toHaveClass('text-muted-foreground');
    });

    it('falls back to "Someone" when the payer is no longer a resolvable member', () => {
        vi.mocked(useExpenses).mockReturnValue({
            data: [{ ...expenses[0]!, paidByUserId: 'unknown-user' }],
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useExpenses>);

        render(<ExpenseList groupId="group-1" members={members} />);

        expect(screen.getByText(/someone paid/i)).toBeInTheDocument();
    });
});
