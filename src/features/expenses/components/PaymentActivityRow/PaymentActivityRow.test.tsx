import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { Payment } from '@features/payments/api/paymentsApi';
import type { User } from '@features/users/api/usersApi';
import { PaymentActivityRow } from './PaymentActivityRow';

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

const payment: Payment = {
    id: 'payment-1',
    groupId: 'group-1',
    fromUserId: currentUser.id,
    toUserId: friend.id,
    amount: 25,
    paidOn: '2026-07-01T00:00:00.000Z',
    createdAt: '2026-07-02T00:00:00.000Z',
};

function renderRow(
    value: Payment,
    options: {
        membersById?: Map<string, User>;
        names?: Map<string, string>;
        onEdit?: () => void;
        onDelete?: () => void;
    } = {},
) {
    return render(
        <PaymentActivityRow
            payment={value}
            membersById={
                options.membersById ??
                new Map([
                    [currentUser.id, currentUser],
                    [friend.id, friend],
                ])
            }
            names={
                options.names ??
                new Map([
                    [currentUser.id, 'You'],
                    [friend.id, 'Priya'],
                ])
            }
            onEdit={options.onEdit ?? vi.fn()}
            onDelete={options.onDelete ?? vi.fn()}
        />,
    );
}

describe('PaymentActivityRow', () => {
    it('shows participant labels and the paid date', () => {
        renderRow(payment);

        expect(screen.getByText('You paid Priya')).toBeInTheDocument();
        expect(screen.getByText('Jul 1, 2026')).toBeInTheDocument();
        expect(screen.getByText('₹25.00')).toBeInTheDocument();
    });

    it('uses neutral member labels and the created date as fallbacks', () => {
        renderRow(
            { ...payment, fromUserId: 'missing-from', toUserId: 'missing-to', paidOn: undefined },
            { membersById: new Map(), names: new Map() },
        );

        expect(screen.getByText('Someone paid Someone')).toBeInTheDocument();
        expect(screen.getByText('Jul 2, 2026')).toBeInTheDocument();
    });

    it('falls back to full member names when disambiguated labels are unavailable', () => {
        renderRow(payment, { names: new Map() });

        expect(screen.getByText('Alex Morgan paid Priya Sharma')).toBeInTheDocument();
    });

    it('wires edit and delete quick actions', async () => {
        const user = userEvent.setup();
        const onEdit = vi.fn();
        const onDelete = vi.fn();
        renderRow(payment, { onEdit, onDelete });

        await user.click(screen.getByRole('button', { name: 'Edit', hidden: true }));
        await user.click(screen.getByRole('button', { name: 'Delete', hidden: true }));

        expect(onEdit).toHaveBeenCalledOnce();
        expect(onDelete).toHaveBeenCalledOnce();
    });
});
