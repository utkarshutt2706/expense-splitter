import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { RecordPaymentDialog } from './RecordPaymentDialog';

vi.mock('../RecordPaymentForm', () => ({
    RecordPaymentForm: ({
        onSubmit,
        onCancel,
    }: {
        onSubmit: (values: { fromUserId: string; toUserId: string; amount: number }) => void;
        onCancel: () => void;
    }) => (
        <div data-testid="record-payment-form">
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

    it('reports closed and forwards the values when the form submits', async () => {
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

        expect(onOpenChange).toHaveBeenCalledWith(false);
        expect(onSubmit).toHaveBeenCalledWith({
            fromUserId: 'user-1',
            toUserId: 'user-2',
            amount: 25,
        });
    });
});
