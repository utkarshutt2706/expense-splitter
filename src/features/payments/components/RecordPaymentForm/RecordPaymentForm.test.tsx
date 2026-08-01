import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { User } from '@data/entities';
import { CURRENT_USER_ID } from '@data/seed';
import { RecordPaymentForm } from './RecordPaymentForm';

vi.mock('@app/hooks', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@app/hooks')>()),
    useCurrentUser: () => ({
        data: { id: CURRENT_USER_ID, name: 'Alex Morgan', email: 'alex@example.com' },
    }),
}));

const members: User[] = [
    { id: CURRENT_USER_ID, name: 'Alex Morgan', email: 'alex@example.com' },
    { id: 'user-2', name: 'Priya Sharma', email: 'priya@example.com' },
];

async function pickMember(ariaLabel: string, memberName: string | RegExp) {
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: ariaLabel }));
    await user.click(screen.getByRole('menuitemradio', { name: memberName }));
}

describe('RecordPaymentForm', () => {
    it('defaults "From" to the current user', () => {
        render(<RecordPaymentForm members={members} onSubmit={vi.fn()} onCancel={vi.fn()} />);

        expect(screen.getByRole('button', { name: 'From' })).toHaveTextContent('You');
    });

    it('shows a validation error when submitted without selecting who received it', async () => {
        const onSubmit = vi.fn();
        const user = userEvent.setup();
        render(<RecordPaymentForm members={members} onSubmit={onSubmit} onCancel={vi.fn()} />);

        await user.type(screen.getByLabelText(/amount/i), '25');
        await user.click(screen.getByRole('button', { name: /record payment/i }));

        expect(
            await screen.findByText(/select who received it/i, { selector: 'p' }),
        ).toBeInTheDocument();
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('shows a validation error when the amount is zero', async () => {
        const onSubmit = vi.fn();
        const user = userEvent.setup();
        render(<RecordPaymentForm members={members} onSubmit={onSubmit} onCancel={vi.fn()} />);

        await pickMember('To', /priya sharma/i);
        await user.type(screen.getByLabelText(/amount/i), '0');
        await user.click(screen.getByRole('button', { name: /record payment/i }));

        expect(await screen.findByText(/amount must be greater than zero/i)).toBeInTheDocument();
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('shows a validation error when the sender and recipient are the same person', async () => {
        const onSubmit = vi.fn();
        const user = userEvent.setup();
        render(<RecordPaymentForm members={members} onSubmit={onSubmit} onCancel={vi.fn()} />);

        await pickMember('To', 'You');
        await user.type(screen.getByLabelText(/amount/i), '25');
        await user.click(screen.getByRole('button', { name: /record payment/i }));

        expect(await screen.findByText(/choose two different people/i)).toBeInTheDocument();
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('calls onSubmit with the entered values', async () => {
        const onSubmit = vi.fn();
        const user = userEvent.setup();
        render(<RecordPaymentForm members={members} onSubmit={onSubmit} onCancel={vi.fn()} />);

        await pickMember('To', /priya sharma/i);
        await user.type(screen.getByLabelText(/amount/i), '25');
        await user.click(screen.getByRole('button', { name: /record payment/i }));

        expect(onSubmit).toHaveBeenCalledWith({
            fromUserId: CURRENT_USER_ID,
            toUserId: 'user-2',
            amount: 25,
        });
    });

    it('prefills fields from initialValues', () => {
        render(
            <RecordPaymentForm
                members={members}
                initialValues={{ fromUserId: 'user-2', toUserId: CURRENT_USER_ID, amount: 40 }}
                onSubmit={vi.fn()}
                onCancel={vi.fn()}
            />,
        );

        expect(screen.getByRole('button', { name: 'From' })).toHaveTextContent('Priya Sharma');
        expect(screen.getByRole('button', { name: 'To' })).toHaveTextContent('You');
        expect(screen.getByLabelText(/amount/i)).toHaveValue(40);
    });

    it('calls onCancel when the cancel button is clicked', async () => {
        const onCancel = vi.fn();
        const user = userEvent.setup();
        render(<RecordPaymentForm members={members} onSubmit={vi.fn()} onCancel={onCancel} />);

        await user.click(screen.getByRole('button', { name: /cancel/i }));

        expect(onCancel).toHaveBeenCalled();
    });
});
