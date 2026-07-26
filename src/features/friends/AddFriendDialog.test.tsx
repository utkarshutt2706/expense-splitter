import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AddFriendDialog } from './AddFriendDialog';

vi.mock('./AddFriendForm', () => ({
    AddFriendForm: ({
        onSubmit,
        onCancel,
    }: {
        onSubmit: (values: { name: string; email: string }) => void;
        onCancel: () => void;
    }) => (
        <div data-testid="add-friend-form">
            <button
                type="button"
                onClick={() => onSubmit({ name: 'Priya Sharma', email: 'priya@example.com' })}
            >
                Fake submit
            </button>
            <button type="button" onClick={onCancel}>
                Fake cancel
            </button>
        </div>
    ),
}));

describe('AddFriendDialog', () => {
    it('opens the dialog when the trigger is clicked', async () => {
        const user = userEvent.setup();
        render(<AddFriendDialog onSubmit={vi.fn()} />);

        expect(screen.queryByTestId('add-friend-form')).not.toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /add friend/i }));

        expect(screen.getByTestId('add-friend-form')).toBeInTheDocument();
        expect(screen.getByText(/add a friend/i)).toBeInTheDocument();
    });

    it('closes the dialog when the close button is clicked', async () => {
        const user = userEvent.setup();
        render(<AddFriendDialog onSubmit={vi.fn()} />);

        await user.click(screen.getByRole('button', { name: /add friend/i }));
        await user.click(screen.getByRole('button', { name: /close/i }));

        expect(screen.queryByTestId('add-friend-form')).not.toBeInTheDocument();
    });

    it('closes the dialog when the form reports cancel', async () => {
        const user = userEvent.setup();
        render(<AddFriendDialog onSubmit={vi.fn()} />);

        await user.click(screen.getByRole('button', { name: /add friend/i }));
        await user.click(screen.getByRole('button', { name: /fake cancel/i }));

        expect(screen.queryByTestId('add-friend-form')).not.toBeInTheDocument();
    });

    it('closes immediately and forwards the values when the form submits', async () => {
        const onSubmit = vi.fn();
        const user = userEvent.setup();
        render(<AddFriendDialog onSubmit={onSubmit} />);

        await user.click(screen.getByRole('button', { name: /add friend/i }));
        await user.click(screen.getByRole('button', { name: /fake submit/i }));

        expect(screen.queryByTestId('add-friend-form')).not.toBeInTheDocument();
        expect(onSubmit).toHaveBeenCalledWith({ name: 'Priya Sharma', email: 'priya@example.com' });
    });
});
