import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AddFriendForm } from './AddFriendForm';

describe('AddFriendForm', () => {
    it('shows validation errors when submitted empty', async () => {
        const onSubmit = vi.fn();

        const user = userEvent.setup();
        render(<AddFriendForm onSubmit={onSubmit} onCancel={vi.fn()} />);

        await user.click(screen.getByRole('button', { name: /add friend/i }));

        expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
        expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('shows a validation error for a malformed email', async () => {
        const onSubmit = vi.fn();

        const user = userEvent.setup();
        render(<AddFriendForm onSubmit={onSubmit} onCancel={vi.fn()} />);

        await user.type(screen.getByLabelText(/name/i), 'Priya Sharma');
        await user.type(screen.getByLabelText(/email/i), 'not-an-email');
        await user.click(screen.getByRole('button', { name: /add friend/i }));

        expect(await screen.findByText(/enter a valid email address/i)).toBeInTheDocument();
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('calls onSubmit with the entered values once valid', async () => {
        const onSubmit = vi.fn();

        const user = userEvent.setup();
        render(<AddFriendForm onSubmit={onSubmit} onCancel={vi.fn()} />);

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
        render(<AddFriendForm onSubmit={vi.fn()} onCancel={onCancel} />);

        await user.click(screen.getByRole('button', { name: /cancel/i }));

        expect(onCancel).toHaveBeenCalled();
    });
});
