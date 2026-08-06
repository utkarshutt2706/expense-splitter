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

    it('keeps the dialog open and shows the backend error when the current password is wrong', async () => {
        mutateAsync.mockRejectedValue(new Error('Current password is incorrect'));
        const user = userEvent.setup();
        render(<ChangePasswordDialog open onOpenChange={onOpenChange} />);

        await fillAndSubmit(user);

        expect(await screen.findByText('Current password is incorrect')).toBeInTheDocument();
        expect(onOpenChange).not.toHaveBeenCalled();
    });
});
