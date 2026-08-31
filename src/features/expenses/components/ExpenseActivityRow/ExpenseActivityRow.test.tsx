import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import type { Expense } from '@features/expenses/api/expensesApi';
import type { User } from '@features/users/api/usersApi';
import { ExpenseActivityRow } from './ExpenseActivityRow';

const currentUser: User = {
    id: 'current-user',
    name: 'Alex Morgan',
    email: 'alex@example.com',
};

const friend: User = {
    id: 'friend-1',
    name: 'Priya Sharma',
    email: 'priya@example.com',
};

const membersById = new Map([
    [currentUser.id, currentUser],
    [friend.id, friend],
]);
const names = new Map([
    [currentUser.id, 'You'],
    [friend.id, 'Priya'],
]);

function expense(overrides: Partial<Expense> = {}): Expense {
    return {
        id: 'expense-1',
        groupId: 'group-1',
        description: 'Dinner',
        amount: 40,
        paidByUserId: friend.id,
        splitType: 'equal',
        splits: [
            { userId: currentUser.id, amount: 20 },
            { userId: friend.id, amount: 20 },
        ],
        createdAt: '2026-07-02T00:00:00.000Z',
        ...overrides,
    };
}

function renderRow(value: Expense, options: { onEdit?: () => void; onDelete?: () => void } = {}) {
    return render(
        <MemoryRouter>
            <ExpenseActivityRow
                groupId="group-1"
                expense={value}
                membersById={membersById}
                names={names}
                currentUserId={currentUser.id}
                onEdit={options.onEdit ?? vi.fn()}
                onDelete={options.onDelete ?? vi.fn()}
            />
        </MemoryRouter>,
    );
}

describe('ExpenseActivityRow', () => {
    it('shows what the current user owes and falls back to the created date', () => {
        renderRow(expense());

        expect(screen.getByText('Priya paid · Jul 2, 2026')).toBeInTheDocument();
        expect(screen.getByText('You owe ₹20.00')).toHaveClass('text-owe');
    });

    it('shows when the current user was not involved', () => {
        renderRow(
            expense({
                splits: [{ userId: friend.id, amount: 40 }],
                paidOn: '2026-07-01T00:00:00.000Z',
            }),
        );

        expect(screen.getByText('Priya paid · Jul 1, 2026')).toBeInTheDocument();
        expect(screen.getByText('You were not involved')).toHaveClass('text-muted-foreground');
    });

    it('uses neutral payer details when the payer is unavailable', () => {
        renderRow(expense({ paidByUserId: 'missing-user' }));

        expect(screen.getByText(/Someone paid/)).toBeInTheDocument();
    });

    it('wires edit and delete quick actions', async () => {
        const user = userEvent.setup();
        const onEdit = vi.fn();
        const onDelete = vi.fn();
        renderRow(expense(), { onEdit, onDelete });

        await user.click(screen.getByRole('button', { name: 'Edit', hidden: true }));
        await user.click(screen.getByRole('button', { name: 'Delete', hidden: true }));

        expect(onEdit).toHaveBeenCalledOnce();
        expect(onDelete).toHaveBeenCalledOnce();
    });
});
