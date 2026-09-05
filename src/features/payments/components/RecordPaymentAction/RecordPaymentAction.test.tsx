import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { User } from '@features/users/api/usersApi';
import { useCreatePayment } from '@features/payments/hooks/useCreatePayment';
import { RecordPaymentAction } from './RecordPaymentAction';

vi.mock('@features/payments/hooks/useCreatePayment', () => ({
    useCreatePayment: vi.fn(),
}));

vi.mock('../RecordPaymentDialog', () => ({
    RecordPaymentDialog: ({
        open,
        onOpenChange,
        onSubmit,
        isPending,
        errorMessage,
    }: {
        open: boolean;
        onOpenChange: (open: boolean) => void;
        onSubmit: (values: { fromUserId: string; toUserId: string; amount: number }) => void;
        isPending: boolean;
        errorMessage?: string;
    }) => (
        <div data-testid="record-payment-dialog">
            <span>{open ? 'Dialog open' : 'Dialog closed'}</span>
            <span>{isPending ? 'Payment pending' : 'Payment idle'}</span>
            {errorMessage && <span role="alert">{errorMessage}</span>}
            <button type="button" onClick={() => onOpenChange(false)}>
                Fake close
            </button>
            <button type="button" onClick={() => onOpenChange(true)}>
                Fake reopen
            </button>
            <button
                type="button"
                onClick={() =>
                    onSubmit({ fromUserId: 'current-user', toUserId: 'friend-1', amount: 25 })
                }
            >
                Fake record payment submit
            </button>
        </div>
    ),
}));

vi.mock('sonner', () => ({
    toast: {
        loading: vi.fn(() => 'toast-id'),
        success: vi.fn(),
        error: vi.fn(),
    },
}));

const members: User[] = [
    { id: 'current-user', name: 'Alex Morgan', email: 'alex@example.com' },
    { id: 'friend-1', name: 'Priya Sharma', email: 'priya@example.com' },
];

describe('RecordPaymentAction', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useCreatePayment).mockReturnValue({
            mutate: vi.fn(),
            isPending: false,
        } as unknown as ReturnType<typeof useCreatePayment>);
    });

    it('renders the record-payment button when the group has at least two members', () => {
        render(<RecordPaymentAction groupId="group-1" members={members} />);

        expect(screen.getByRole('button', { name: 'Record a payment' })).toBeInTheDocument();
    });

    it('hides the record-payment button when the group has fewer than two members', () => {
        render(<RecordPaymentAction groupId="group-1" members={[members[0]!]} />);

        expect(screen.queryByRole('button', { name: 'Record a payment' })).not.toBeInTheDocument();
    });

    it('reads as an action rather than a balance status', () => {
        render(<RecordPaymentAction groupId="group-1" members={members} />);

        const trigger = screen.getByRole('button', { name: 'Record a payment' });

        // bg-owed is the green that means "you are owed" elsewhere; on a button
        // it read as a status colour rather than something to press.
        expect(trigger.className).not.toContain('bg-owed');
        expect(trigger).toHaveTextContent('Record a payment');
    });

    it('records a payment and shows a loading toast, then success', async () => {
        let onSuccess: (() => void) | undefined;
        const mutate = vi.fn((_values, options: { onSuccess?: () => void }) => {
            onSuccess = options.onSuccess;
        });
        vi.mocked(useCreatePayment).mockReturnValue({
            mutate,
            isPending: false,
        } as unknown as ReturnType<typeof useCreatePayment>);

        const user = userEvent.setup();
        render(<RecordPaymentAction groupId="group-1" members={members} />);

        await user.click(screen.getByRole('button', { name: /fake record payment submit/i }));

        expect(toast.loading).toHaveBeenCalledWith('Payment is being recorded…');
        expect(mutate).toHaveBeenCalledWith(
            {
                groupId: 'group-1',
                fromUserId: 'current-user',
                toUserId: 'friend-1',
                amount: 25,
            },
            expect.anything(),
        );

        act(() => onSuccess?.());

        expect(toast.success).toHaveBeenCalledWith('Payment recorded', { id: 'toast-id' });
        expect(screen.getByText('Dialog closed')).toBeInTheDocument();
    });

    it('shows an error toast when recording a payment fails', async () => {
        let onError: ((error: Error) => void) | undefined;
        const mutate = vi.fn((_values, options: { onError?: (error: Error) => void }) => {
            onError = options.onError;
        });
        vi.mocked(useCreatePayment).mockReturnValue({
            mutate,
            isPending: false,
        } as unknown as ReturnType<typeof useCreatePayment>);

        const user = userEvent.setup();
        render(<RecordPaymentAction groupId="group-1" members={members} />);

        await user.click(screen.getByRole('button', { name: /fake record payment submit/i }));
        act(() => onError?.(new Error('Something went wrong')));

        expect(toast.error).toHaveBeenCalledWith(
            'We couldn’t record this payment. Nothing was changed. Try again.',
            { id: 'toast-id' },
        );
        expect(screen.getByRole('alert')).toHaveTextContent(
            'We couldn’t record this payment. Nothing was changed. Try again.',
        );
    });

    it('opens the dialog and clears a previous mutation error when it is closed', async () => {
        let onError: (() => void) | undefined;
        vi.mocked(useCreatePayment).mockReturnValue({
            mutate: vi.fn((_values, options: { onError?: () => void }) => {
                onError = options.onError;
            }),
            isPending: false,
        } as unknown as ReturnType<typeof useCreatePayment>);
        const user = userEvent.setup();
        render(<RecordPaymentAction groupId="group-1" members={members} />);

        expect(screen.getByText('Dialog closed')).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Record a payment' }));
        expect(screen.getByText('Dialog open')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /fake record payment submit/i }));
        act(() => onError?.());
        expect(screen.getByRole('alert')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /fake reopen/i }));
        expect(screen.getByRole('alert')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /fake close/i }));
        expect(screen.getByText('Dialog closed')).toBeInTheDocument();
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('ignores duplicate submissions while a payment is pending', async () => {
        const mutate = vi.fn();
        vi.mocked(useCreatePayment).mockReturnValue({
            mutate,
            isPending: true,
        } as unknown as ReturnType<typeof useCreatePayment>);
        const user = userEvent.setup();
        render(<RecordPaymentAction groupId="group-1" members={members} />);

        await user.click(screen.getByRole('button', { name: /fake record payment submit/i }));

        expect(mutate).not.toHaveBeenCalled();
        expect(toast.loading).not.toHaveBeenCalled();
    });
});
