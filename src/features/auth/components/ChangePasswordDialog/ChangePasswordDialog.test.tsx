import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useChangePassword } from '@features/auth/hooks/useChangePassword';
import { ChangePasswordDialog } from './ChangePasswordDialog';

vi.mock('@features/auth/hooks/useChangePassword', () => ({
    useChangePassword: vi.fn(),
}));

vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

describe('ChangePasswordDialog', () => {
    const onOpenChange = vi.fn();
    let mutateAsync: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        vi.clearAllMocks();
        mutateAsync = vi.fn();
        vi.mocked(useChangePassword).mockReturnValue({
            mutateAsync,
        } as unknown as ReturnType<typeof useChangePassword>);
    });

    async function fillAndSubmit(
        user: ReturnType<typeof userEvent.setup>,
        values: { current?: string; next?: string; confirm?: string } = {},
    ) {
        const {
            current = 'old-password',
            next = 'new-password',
            confirm = 'new-password',
        } = values;

        if (current) {
            await user.type(screen.getByLabelText(/current password/i), current);
        }
        if (next) {
            await user.type(screen.getByLabelText(/^new password$/i), next);
        }
        if (confirm) {
            await user.type(screen.getByLabelText(/confirm new password/i), confirm);
        }
        await user.click(screen.getByRole('button', { name: /change password/i }));
    }

    it('submits the current and new password and shows a success toast', async () => {
        mutateAsync.mockResolvedValue(undefined);
        const user = userEvent.setup();
        render(<ChangePasswordDialog open onOpenChange={onOpenChange} />);

        await fillAndSubmit(user);

        expect(mutateAsync).toHaveBeenCalledWith({
            currentPassword: 'old-password',
            newPassword: 'new-password',
        });
        expect(toast.success).toHaveBeenCalledWith('Password changed');
        expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('shows a validation error and does not submit when the new passwords do not match', async () => {
        const user = userEvent.setup();
        render(<ChangePasswordDialog open onOpenChange={onOpenChange} />);

        await fillAndSubmit(user, { confirm: 'a-different-password' });

        expect(await screen.findByText('Passwords do not match')).toBeInTheDocument();
        expect(mutateAsync).not.toHaveBeenCalled();
    });

    it('requires the current password and enforces the new-password minimum length', async () => {
        const user = userEvent.setup();
        render(<ChangePasswordDialog open onOpenChange={onOpenChange} />);

        await fillAndSubmit(user, { current: '', next: 'short', confirm: 'short' });

        expect(await screen.findByText('Enter your current password')).toBeInTheDocument();
        expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
        expect(mutateAsync).not.toHaveBeenCalled();
    });

    it('requires confirmation of the new password', async () => {
        const user = userEvent.setup();
        render(<ChangePasswordDialog open onOpenChange={onOpenChange} />);

        await fillAndSubmit(user, { confirm: '' });

        expect(await screen.findByText('Confirm your new password')).toBeInTheDocument();
        expect(mutateAsync).not.toHaveBeenCalled();
    });

    it('rejects a new password above the API maximum length', async () => {
        const user = userEvent.setup();
        const oversizedPassword = 'a'.repeat(201);
        render(<ChangePasswordDialog open onOpenChange={onOpenChange} />);

        await fillAndSubmit(user, { next: oversizedPassword, confirm: oversizedPassword });

        expect(
            await screen.findByText('Password must be at most 200 characters'),
        ).toBeInTheDocument();
        expect(mutateAsync).not.toHaveBeenCalled();
    });

    it('disables submission and shows progress while changing the password', async () => {
        let resolveChange!: () => void;
        mutateAsync.mockImplementation(
            () =>
                new Promise<void>((resolve) => {
                    resolveChange = resolve;
                }),
        );
        const user = userEvent.setup();
        render(<ChangePasswordDialog open onOpenChange={onOpenChange} />);

        await fillAndSubmit(user);

        expect(await screen.findByRole('button', { name: 'Changing…' })).toBeDisabled();
        resolveChange();
        await screen.findByRole('button', { name: /change password/i });
    });

    it('keeps the dialog open and shows the backend error when the current password is wrong', async () => {
        mutateAsync.mockRejectedValue(new Error('Current password is incorrect'));
        const user = userEvent.setup();
        render(<ChangePasswordDialog open onOpenChange={onOpenChange} />);

        await fillAndSubmit(user);

        expect(await screen.findByText('Current password is incorrect')).toBeInTheDocument();
        expect(onOpenChange).not.toHaveBeenCalled();
    });

    it('shows a fallback error when the mutation rejects without an Error object', async () => {
        mutateAsync.mockRejectedValue('request failed');
        const user = userEvent.setup();
        render(<ChangePasswordDialog open onOpenChange={onOpenChange} />);

        await fillAndSubmit(user);

        expect(await screen.findByText('Something went wrong.')).toBeInTheDocument();
        expect(onOpenChange).not.toHaveBeenCalled();
    });

    it('closes when cancel is selected', async () => {
        const user = userEvent.setup();
        render(<ChangePasswordDialog open onOpenChange={onOpenChange} />);

        await user.click(screen.getByRole('button', { name: /cancel/i }));

        expect(onOpenChange).toHaveBeenCalledWith(false);
        expect(mutateAsync).not.toHaveBeenCalled();
    });

    it('resets entered values after the dialog closes', async () => {
        const user = userEvent.setup();
        const { rerender } = render(<ChangePasswordDialog open onOpenChange={onOpenChange} />);
        const currentPassword = screen.getByLabelText(/current password/i);

        await user.type(currentPassword, 'partially-entered');
        rerender(<ChangePasswordDialog open={false} onOpenChange={onOpenChange} />);
        rerender(<ChangePasswordDialog open onOpenChange={onOpenChange} />);

        expect(screen.getByLabelText(/current password/i)).toHaveValue('');
    });
});
