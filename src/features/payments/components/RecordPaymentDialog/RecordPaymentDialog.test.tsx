import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { RecordPaymentDialog } from './RecordPaymentDialog';

const currentUser = vi.hoisted(() => ({ id: 'current-user' }));

vi.mock('@app/hooks', () => ({
    useCurrentUser: () => ({ data: { id: currentUser.id, name: 'Current User' } }),
}));

vi.mock('../RecordPaymentForm', () => ({
    RecordPaymentForm: ({
        onSubmit,
        onCancel,
        lockParticipants,
        outstandingAmount,
    }: {
        onSubmit: (values: { fromUserId: string; toUserId: string; amount: number }) => void;
        onCancel: () => void;
        lockParticipants?: boolean;
        outstandingAmount?: number;
    }) => (
        <div data-testid="record-payment-form">
            <span>
                {lockParticipants ? `Locked at ${outstandingAmount}` : 'Editable participants'}
            </span>
            <button
                type="button"
                onClick={() => onSubmit({ fromUserId: 'user-1', toUserId: 'user-2', amount: 25 })}
            >
                Fake submit
            </button>
            <button type="button" onClick={onCancel}>
                Fake cancel
            </button>
        </div>
    ),
}));

describe('RecordPaymentDialog', () => {
    beforeEach(() => {
        currentUser.id = 'current-user';
    });

    it('does not render the form when closed', () => {
        render(
            <RecordPaymentDialog
                open={false}
                onOpenChange={vi.fn()}
                members={[]}
                onSubmit={vi.fn()}
            />,
        );

        expect(screen.queryByTestId('record-payment-form')).not.toBeInTheDocument();
    });

    it('renders the form when open', () => {
        render(<RecordPaymentDialog open onOpenChange={vi.fn()} members={[]} onSubmit={vi.fn()} />);

        expect(screen.getByTestId('record-payment-form')).toBeInTheDocument();
        expect(screen.getByText(/record a payment/i)).toBeInTheDocument();
    });

    it('uses edit copy when editing a payment', () => {
        render(
            <RecordPaymentDialog
                mode="edit"
                open
                onOpenChange={vi.fn()}
                members={[]}
                onSubmit={vi.fn()}
            />,
        );

        expect(screen.getByRole('heading', { name: 'Edit payment' })).toBeInTheDocument();
        expect(screen.getByText(/update the payer, recipient, or amount/i)).toBeInTheDocument();
    });

    it('shows settlement context and locks the canonical participant pair', () => {
        render(
            <RecordPaymentDialog
                open
                onOpenChange={vi.fn()}
                members={[
                    { id: 'user-1', name: 'Jayant Sachan', email: 'jayant@example.com' },
                    { id: 'user-2', name: 'Rohan Dwivedi', email: 'rohan@example.com' },
                ]}
                initialValues={{ fromUserId: 'user-1', toUserId: 'user-2', amount: 9388.09 }}
                settlementMode
                onSubmit={vi.fn()}
            />,
        );

        expect(screen.getByText('Record a settlement from Jayant to Rohan.')).toBeInTheDocument();
        expect(screen.getByText('Locked at 9388.09')).toBeInTheDocument();
    });

    it('requires explicit confirmation for a third-party settlement', async () => {
        const onSubmit = vi.fn();
        const user = userEvent.setup();
        render(
            <RecordPaymentDialog
                open
                onOpenChange={vi.fn()}
                members={[
                    { id: 'user-1', name: 'Jayant Sachan', email: 'jayant@example.com' },
                    { id: 'user-2', name: 'Rohan Dwivedi', email: 'rohan@example.com' },
                ]}
                initialValues={{ fromUserId: 'user-1', toUserId: 'user-2', amount: 25 }}
                settlementMode
                onSubmit={onSubmit}
            />,
        );

        await user.click(screen.getByRole('button', { name: /fake submit/i }));
        expect(onSubmit).not.toHaveBeenCalled();
        expect(screen.getByText(/record that jayant paid rohan ₹25\.00/i)).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Record payment' }));
        expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    it('reports closed when the close button is clicked', async () => {
        const onOpenChange = vi.fn();
        const user = userEvent.setup();
        render(
            <RecordPaymentDialog
                open
                onOpenChange={onOpenChange}
                members={[]}
                onSubmit={vi.fn()}
            />,
        );

        await user.click(screen.getByRole('button', { name: /close/i }));

        expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('reports closed when the form reports cancel', async () => {
        const onOpenChange = vi.fn();
        const user = userEvent.setup();
        render(
            <RecordPaymentDialog
                open
                onOpenChange={onOpenChange}
                members={[]}
                onSubmit={vi.fn()}
            />,
        );

        await user.click(screen.getByRole('button', { name: /fake cancel/i }));

        expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('keeps a create dialog open and forwards the values when the form submits', async () => {
        const onOpenChange = vi.fn();
        const onSubmit = vi.fn();
        const user = userEvent.setup();
        render(
            <RecordPaymentDialog
                open
                onOpenChange={onOpenChange}
                members={[]}
                onSubmit={onSubmit}
            />,
        );

        await user.click(screen.getByRole('button', { name: /fake submit/i }));

        expect(onOpenChange).not.toHaveBeenCalledWith(false);
        expect(onSubmit).toHaveBeenCalledWith({
            fromUserId: 'user-1',
            toUserId: 'user-2',
            amount: 25,
        });
    });

    it('closes an edit dialog before forwarding the updated values', async () => {
        const onOpenChange = vi.fn();
        const onSubmit = vi.fn();
        const user = userEvent.setup();
        render(
            <RecordPaymentDialog
                mode="edit"
                open
                onOpenChange={onOpenChange}
                members={[]}
                onSubmit={onSubmit}
            />,
        );

        await user.click(screen.getByRole('button', { name: /fake submit/i }));

        expect(onOpenChange).toHaveBeenCalledWith(false);
        expect(onOpenChange.mock.invocationCallOrder[0]).toBeLessThan(
            onSubmit.mock.invocationCallOrder[0]!,
        );
        expect(onSubmit).toHaveBeenCalledOnce();
    });

    it.each(['user-1', 'user-2'])(
        'submits a settlement involving the current user as %s without confirmation',
        async (currentUserId) => {
            currentUser.id = currentUserId;
            const onSubmit = vi.fn();
            const user = userEvent.setup();
            render(
                <RecordPaymentDialog
                    open
                    onOpenChange={vi.fn()}
                    members={[]}
                    initialValues={{ fromUserId: 'user-1', toUserId: 'user-2', amount: 25 }}
                    settlementMode
                    onSubmit={onSubmit}
                />,
            );

            await user.click(screen.getByRole('button', { name: /fake submit/i }));

            expect(onSubmit).toHaveBeenCalledOnce();
            expect(screen.queryByText(/record that/i)).not.toBeInTheDocument();
        },
    );

    it('cancels and clears a third-party confirmation', async () => {
        const onSubmit = vi.fn();
        const user = userEvent.setup();
        render(
            <RecordPaymentDialog
                open
                onOpenChange={vi.fn()}
                members={[]}
                initialValues={{ fromUserId: 'user-1', toUserId: 'user-2', amount: 25 }}
                settlementMode
                onSubmit={onSubmit}
            />,
        );

        await user.click(screen.getByRole('button', { name: /fake submit/i }));
        await user.click(screen.getByRole('button', { name: 'Cancel' }));

        expect(screen.getByTestId('record-payment-form')).toBeInTheDocument();
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('clears a confirmation when the dialog closes', async () => {
        const onOpenChange = vi.fn();
        const user = userEvent.setup();
        const { rerender } = render(
            <RecordPaymentDialog
                open
                onOpenChange={onOpenChange}
                members={[]}
                initialValues={{ fromUserId: 'user-1', toUserId: 'user-2', amount: 25 }}
                settlementMode
                onSubmit={vi.fn()}
            />,
        );
        await user.click(screen.getByRole('button', { name: /fake submit/i }));

        await user.click(screen.getByRole('button', { name: /close/i }));
        rerender(
            <RecordPaymentDialog
                open
                onOpenChange={onOpenChange}
                members={[]}
                initialValues={{ fromUserId: 'user-1', toUserId: 'user-2', amount: 25 }}
                settlementMode
                onSubmit={vi.fn()}
            />,
        );

        expect(screen.getByTestId('record-payment-form')).toBeInTheDocument();
    });

    it('shows fallback names, an error, and pending controls in third-party confirmation', async () => {
        const user = userEvent.setup();
        render(
            <RecordPaymentDialog
                open
                onOpenChange={vi.fn()}
                members={[]}
                initialValues={{ fromUserId: 'user-1', toUserId: 'user-2', amount: 25 }}
                settlementMode
                isPending
                errorMessage="Payment failed"
                onSubmit={vi.fn()}
            />,
        );

        await user.click(screen.getByRole('button', { name: /fake submit/i }));

        expect(
            screen.getByText('Record that a group member paid a group member ₹25.00?'),
        ).toBeInTheDocument();
        expect(screen.getByRole('alert')).toHaveTextContent('Payment failed');
        expect(screen.getByRole('button', { name: 'Recording…' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    });
});
