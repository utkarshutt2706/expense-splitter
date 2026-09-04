import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { Expense } from '@features/expenses/api/expensesApi';
import type { User } from '@features/users/api/usersApi';

import { ExpenseDetailContent } from './ExpenseDetailContent';

vi.mock('@shared/components', () => ({
    Avatar: ({ name, size }: { name: string; size?: string }) => (
        <span data-testid="avatar" data-name={name} data-size={size} />
    ),
}));

const members: User[] = [
    { id: 'current', name: 'Utkarsh Srivastava' },
    { id: 'chris', name: 'Chris' },
    { id: 'alex', name: 'Alex Morgan' },
];

function expense(overrides: Partial<Expense> = {}): Expense {
    return {
        id: 'expense-1',
        groupId: 'group-1',
        description: 'Dinner',
        amount: 100,
        paidByUserId: 'current',
        createdByUserId: 'alex',
        splitType: 'equal',
        splits: [
            { userId: 'current', amount: 40 },
            { userId: 'alex', amount: 30 },
            { userId: 'chris', amount: 30 },
        ],
        paidOn: '2026-08-10T00:00:00.000Z',
        createdAt: '2026-08-11T00:00:00.000Z',
        ...overrides,
    };
}

describe('ExpenseDetailContent', () => {
    it('shows the amount, creator, payer, and their relevant dates', () => {
        render(
            <ExpenseDetailContent expense={expense()} members={members} currentUserId="current" />,
        );

        expect(screen.getByText('₹100.00')).toBeInTheDocument();
        expect(screen.getByText('Added by Alex on Aug 11, 2026')).toBeInTheDocument();
        expect(screen.getByText(/You paid ₹100\.00/)).toHaveTextContent('on Aug 10, 2026');
        expect(screen.getAllByTestId('avatar')[0]).toHaveAttribute(
            'data-name',
            'Utkarsh Srivastava',
        );
    });

    it('orders included participants alphabetically with the current user first', () => {
        render(
            <ExpenseDetailContent expense={expense()} members={members} currentUserId="current" />,
        );

        const rows = screen.getAllByRole('listitem');
        expect(rows).toHaveLength(3);
        expect(within(rows[0]!).getByText('Your share ₹40.00')).toBeInTheDocument();
        expect(within(rows[1]!).getByText('Alex’s share ₹30.00')).toBeInTheDocument();
        expect(within(rows[2]!).getByText('Share for Chris ₹30.00')).toBeInTheDocument();
    });

    it('shows the payer amount covered for others using cent arithmetic', () => {
        render(
            <ExpenseDetailContent expense={expense()} members={members} currentUserId="current" />,
        );

        expect(screen.getByText('You covered ₹60.00 for others.')).toBeInTheDocument();
    });

    it('omits coverage when the payer has no valid positive remainder', () => {
        const { rerender } = render(
            <ExpenseDetailContent
                expense={expense({ splits: [{ userId: 'alex', amount: 100 }] })}
                members={members}
                currentUserId="current"
            />,
        );
        expect(screen.queryByText(/covered .* for others/i)).not.toBeInTheDocument();

        rerender(
            <ExpenseDetailContent
                expense={expense({ splits: [{ userId: 'current', amount: 100 }] })}
                members={members}
                currentUserId="current"
            />,
        );
        expect(screen.queryByText(/covered .* for others/i)).not.toBeInTheDocument();
    });

    it('uses safe fallbacks for missing payer and creator records', () => {
        render(
            <ExpenseDetailContent
                expense={expense({
                    paidByUserId: 'missing-payer',
                    createdByUserId: 'missing-creator',
                    splits: [],
                })}
                members={members}
            />,
        );

        expect(screen.getByText('Added by Someone on Aug 11, 2026')).toBeInTheDocument();
        expect(screen.getByText(/Someone paid ₹100\.00/)).toBeInTheDocument();
        expect(screen.getByTestId('avatar')).toHaveAttribute('data-name', '?');
        expect(screen.queryAllByRole('listitem')).toHaveLength(0);
    });
});
