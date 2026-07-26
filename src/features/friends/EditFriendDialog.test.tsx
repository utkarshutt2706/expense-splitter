import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { EditFriendDialog } from './EditFriendDialog';

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
                onClick={() => onSubmit({ name: 'Priya S.', email: 'priya@example.com' })}
            >
                Fake submit
            </button>
            <button type="button" onClick={onCancel}>
                Fake cancel
            </button>
        </div>
    ),
}));

const initialValues = { name: 'Priya Sharma', email: 'priya@example.com' };

describe('EditFriendDialog', () => {
    it('renders the form when open', () => {
        render(
            <EditFriendDialog
                open
                onOpenChange={vi.fn()}
                initialValues={initialValues}
                onSubmit={vi.fn()}
            />,
        );

        expect(screen.getByTestId('friend-form')).toBeInTheDocument();
        expect(screen.getByText(/edit friend/i)).toBeInTheDocument();
    });

    it('does not render the form when closed', () => {
        render(
            <EditFriendDialog
                open={false}
                onOpenChange={vi.fn()}
                initialValues={initialValues}
                onSubmit={vi.fn()}
            />,
        );

        expect(screen.queryByTestId('friend-form')).not.toBeInTheDocument();
    });

    it('reports closed when the close button is clicked', async () => {
        const onOpenChange = vi.fn();
        const user = userEvent.setup();
        render(
            <EditFriendDialog
                open
                onOpenChange={onOpenChange}
                initialValues={initialValues}
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
            <EditFriendDialog
                open
                onOpenChange={onOpenChange}
                initialValues={initialValues}
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
            <EditFriendDialog
                open
                onOpenChange={onOpenChange}
                initialValues={initialValues}
                onSubmit={onSubmit}
            />,
        );

        await user.click(screen.getByRole('button', { name: /fake submit/i }));

        expect(onOpenChange).toHaveBeenCalledWith(false);
        expect(onSubmit).toHaveBeenCalledWith({ name: 'Priya S.', email: 'priya@example.com' });
    });
});
