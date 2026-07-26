import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { UpsertFriendDialog } from './UpsertFriendDialog';

vi.mock('./FriendForm', () => ({
    FriendForm: ({
        onSubmit,
        onCancel,
    }: {
        onSubmit: (values: { name: string; email: string }) => void;
        onCancel: () => void;
    }) => (
        <div data-testid="friend-form">
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

describe('UpsertFriendDialog', () => {
    it('does not render the form when closed', () => {
        render(
            <UpsertFriendDialog
                mode="add"
                open={false}
                onOpenChange={vi.fn()}
                onSubmit={vi.fn()}
            />,
        );

        expect(screen.queryByTestId('friend-form')).not.toBeInTheDocument();
    });

    it('renders the add-mode title when open', () => {
        render(<UpsertFriendDialog mode="add" open onOpenChange={vi.fn()} onSubmit={vi.fn()} />);

        expect(screen.getByTestId('friend-form')).toBeInTheDocument();
        expect(screen.getByText(/add a friend/i)).toBeInTheDocument();
    });

    it('renders the edit-mode title when open', () => {
        render(<UpsertFriendDialog mode="edit" open onOpenChange={vi.fn()} onSubmit={vi.fn()} />);

        expect(screen.getByTestId('friend-form')).toBeInTheDocument();
        expect(screen.getByText(/edit friend/i)).toBeInTheDocument();
    });

    it('reports closed when the close button is clicked', async () => {
        const onOpenChange = vi.fn();
        const user = userEvent.setup();
        render(
            <UpsertFriendDialog mode="add" open onOpenChange={onOpenChange} onSubmit={vi.fn()} />,
        );

        await user.click(screen.getByRole('button', { name: /close/i }));

        expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('reports closed when the form reports cancel', async () => {
        const onOpenChange = vi.fn();
        const user = userEvent.setup();
        render(
            <UpsertFriendDialog mode="add" open onOpenChange={onOpenChange} onSubmit={vi.fn()} />,
        );

        await user.click(screen.getByRole('button', { name: /fake cancel/i }));

        expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('reports closed and forwards the values when the form submits', async () => {
        const onOpenChange = vi.fn();
        const onSubmit = vi.fn();
        const user = userEvent.setup();
        render(
            <UpsertFriendDialog mode="edit" open onOpenChange={onOpenChange} onSubmit={onSubmit} />,
        );

        await user.click(screen.getByRole('button', { name: /fake submit/i }));

        expect(onOpenChange).toHaveBeenCalledWith(false);
        expect(onSubmit).toHaveBeenCalledWith({ name: 'Priya Sharma', email: 'priya@example.com' });
    });
});
