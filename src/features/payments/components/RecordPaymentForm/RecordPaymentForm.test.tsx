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

    it('defaults the paid date to today and calls onSubmit with the entered values', async () => {
        const onSubmit = vi.fn();
        const user = userEvent.setup();
        const today = new Date();
        const todayInput = new Date(today.getTime() - today.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 10);

        render(<RecordPaymentForm members={members} onSubmit={onSubmit} onCancel={vi.fn()} />);

        expect(screen.getByLabelText(/paid on/i)).toHaveValue(todayInput);

        await pickMember('To', /priya sharma/i);
        await user.type(screen.getByLabelText(/amount/i), '25');
        await user.click(screen.getByRole('button', { name: /record payment/i }));

        expect(onSubmit).toHaveBeenCalledWith({
            fromUserId: CURRENT_USER_ID,
            toUserId: 'user-2',
            amount: 25,
            paidOn: todayInput,
        });
    });

    it('opens the calendar when the paid date input is clicked', async () => {
        const user = userEvent.setup();
        const showPicker = vi.fn();
        render(<RecordPaymentForm members={members} onSubmit={vi.fn()} onCancel={vi.fn()} />);
        Object.defineProperty(screen.getByLabelText(/paid on/i), 'showPicker', {
            configurable: true,
            value: showPicker,
        });

        await user.click(screen.getByLabelText(/paid on/i));

        expect(showPicker).toHaveBeenCalledOnce();
    });

    it('rejects a manually entered future paid date', async () => {
        const user = userEvent.setup();
        render(<RecordPaymentForm members={members} onSubmit={vi.fn()} onCancel={vi.fn()} />);

        await user.clear(screen.getByLabelText(/paid on/i));
        await user.type(screen.getByLabelText(/paid on/i), '2099-12-31');
        await user.click(screen.getByRole('button', { name: /record payment/i }));

        expect(await screen.findByText(/paid date cannot be in the future/i)).toBeInTheDocument();
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

    it('locks settlement participants and explains full and partial payment amounts', async () => {
        const user = userEvent.setup();
        render(
            <RecordPaymentForm
                members={members}
                initialValues={{ fromUserId: 'user-2', toUserId: CURRENT_USER_ID, amount: 9388.09 }}
                lockParticipants
                outstandingAmount={9388.09}
                onSubmit={vi.fn()}
                onCancel={vi.fn()}
            />,
        );

        expect(screen.getByLabelText('From: Priya Sharma')).toHaveTextContent('Priya Sharma');
        expect(screen.getByLabelText('To: You')).toHaveTextContent('You');
        expect(screen.queryByRole('button', { name: 'From' })).not.toBeInTheDocument();
        expect(screen.getByLabelText(/amount/i)).toHaveFocus();
        expect(screen.getByText(/settles the suggested balance in full/i)).toBeInTheDocument();

        await user.clear(screen.getByLabelText(/amount/i));
        await user.type(screen.getByLabelText(/amount/i), '6000');
        expect(screen.getByText('₹3,388.09 will remain after this payment.')).toBeInTheDocument();
    });

    it('blocks a settlement amount above the canonical outstanding amount', async () => {
        const onSubmit = vi.fn();
        const user = userEvent.setup();
        render(
            <RecordPaymentForm
                members={members}
                initialValues={{ fromUserId: CURRENT_USER_ID, toUserId: 'user-2', amount: 25 }}
                lockParticipants
                outstandingAmount={25}
                onSubmit={onSubmit}
                onCancel={vi.fn()}
            />,
        );

        await user.clear(screen.getByLabelText(/amount/i));
        await user.type(screen.getByLabelText(/amount/i), '25.01');
        await user.click(screen.getByRole('button', { name: /record payment/i }));

        expect(
            await screen.findByText(/cannot exceed the outstanding balance of ₹25\.00/i),
        ).toBeInTheDocument();
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('rejects amounts with unsupported currency precision', async () => {
        const onSubmit = vi.fn();
        const user = userEvent.setup();
        render(<RecordPaymentForm members={members} onSubmit={onSubmit} onCancel={vi.fn()} />);

        await pickMember('To', /priya sharma/i);
        await user.type(screen.getByLabelText(/amount/i), '1.001');
        await user.click(screen.getByRole('button', { name: /record payment/i }));

        expect(await screen.findByText(/at most two decimal places/i)).toBeInTheDocument();
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('calls onCancel when the cancel button is clicked', async () => {
        const onCancel = vi.fn();
        const user = userEvent.setup();
        render(<RecordPaymentForm members={members} onSubmit={vi.fn()} onCancel={onCancel} />);

        await user.click(screen.getByRole('button', { name: /cancel/i }));

        expect(onCancel).toHaveBeenCalled();
    });
});
