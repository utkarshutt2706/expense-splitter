import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FriendForm } from './FriendForm';

describe('FriendForm', () => {
    describe('add mode', () => {
        it('shows validation errors when submitted empty', async () => {
            const onSubmit = vi.fn();

            const user = userEvent.setup();
            render(<FriendForm mode="add" onSubmit={onSubmit} onCancel={vi.fn()} />);

            await user.click(screen.getByRole('button', { name: /add friend/i }));

            expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
            expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
            expect(onSubmit).not.toHaveBeenCalled();
        });

        it('shows a validation error for a malformed email', async () => {
            const onSubmit = vi.fn();

            const user = userEvent.setup();
            render(<FriendForm mode="add" onSubmit={onSubmit} onCancel={vi.fn()} />);

            await user.type(screen.getByLabelText(/name/i), 'Priya Sharma');
            await user.type(screen.getByLabelText(/email/i), 'not-an-email');
            await user.click(screen.getByRole('button', { name: /add friend/i }));

            expect(await screen.findByText(/enter a valid email address/i)).toBeInTheDocument();
            expect(onSubmit).not.toHaveBeenCalled();
        });

        it('calls onSubmit with the entered values once valid', async () => {
            const onSubmit = vi.fn();

            const user = userEvent.setup();
            render(<FriendForm mode="add" onSubmit={onSubmit} onCancel={vi.fn()} />);

            await user.type(screen.getByLabelText(/name/i), 'Priya Sharma');
            await user.type(screen.getByLabelText(/email/i), 'priya@example.com');
            await user.click(screen.getByRole('button', { name: /add friend/i }));

            expect(onSubmit).toHaveBeenCalledWith({
                name: 'Priya Sharma',
                email: 'priya@example.com',
            });
        });

        it('calls onCancel when the cancel button is clicked', async () => {
            const onCancel = vi.fn();

            const user = userEvent.setup();
            render(<FriendForm mode="add" onSubmit={vi.fn()} onCancel={onCancel} />);

            await user.click(screen.getByRole('button', { name: /cancel/i }));

            expect(onCancel).toHaveBeenCalled();
        });
    });

    describe('edit mode', () => {
        it('pre-fills the fields from initialValues', () => {
            render(
                <FriendForm
                    mode="edit"
                    initialValues={{ name: 'Priya Sharma', email: 'priya@example.com' }}
                    onSubmit={vi.fn()}
                    onCancel={vi.fn()}
                />,
            );

            expect(screen.getByLabelText(/name/i)).toHaveValue('Priya Sharma');
            expect(screen.getByLabelText(/email/i)).toHaveValue('priya@example.com');
        });

        it('shows a save-changes submit button', () => {
            render(
                <FriendForm
                    mode="edit"
                    initialValues={{ name: 'Priya Sharma', email: 'priya@example.com' }}
                    onSubmit={vi.fn()}
                    onCancel={vi.fn()}
                />,
            );

            expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
        });

        it('calls onSubmit with the edited values', async () => {
            const onSubmit = vi.fn();

            const user = userEvent.setup();
            render(
                <FriendForm
                    mode="edit"
                    initialValues={{ name: 'Priya Sharma', email: 'priya@example.com' }}
                    onSubmit={onSubmit}
                    onCancel={vi.fn()}
                />,
            );

            await user.clear(screen.getByLabelText(/name/i));
            await user.type(screen.getByLabelText(/name/i), 'Priya S.');
            await user.click(screen.getByRole('button', { name: /save changes/i }));

            expect(onSubmit).toHaveBeenCalledWith({
                name: 'Priya S.',
                email: 'priya@example.com',
            });
        });
    });
});
