import { act, renderHook, waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useChangePassword } from '@features/auth/hooks/useChangePassword';
import { useChangePasswordForm } from './useChangePasswordForm';

vi.mock('@features/auth/hooks/useChangePassword', () => ({
    useChangePassword: vi.fn(),
}));

vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
    },
}));

describe('useChangePasswordForm', () => {
    const onOpenChange = vi.fn();
    let mutateAsync: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        vi.clearAllMocks();
        mutateAsync = vi.fn();
        vi.mocked(useChangePassword).mockReturnValue({
            mutateAsync,
        } as unknown as ReturnType<typeof useChangePassword>);
    });

    function fillValidForm(result: ReturnType<typeof renderPasswordForm>['result']) {
        act(() => {
            result.current.setValue('currentPassword', 'old-password');
            result.current.setValue('newPassword', 'new-password');
            result.current.setValue('confirmNewPassword', 'new-password');
        });
    }

    function renderPasswordForm(open = true) {
        return renderHook(
            ({ isOpen }) => {
                const form = useChangePasswordForm({ open: isOpen, onOpenChange });
                void form.formState.errors;
                return form;
            },
            { initialProps: { isOpen: open } },
        );
    }

    it('submits the current and new passwords, then closes the dialog', async () => {
        mutateAsync.mockResolvedValue(undefined);
        const { result } = renderPasswordForm();
        fillValidForm(result);

        await act(async () => result.current.submit());

        expect(mutateAsync).toHaveBeenCalledWith({
            currentPassword: 'old-password',
            newPassword: 'new-password',
        });
        expect(toast.success).toHaveBeenCalledWith('Password changed');
        expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('reports schema validation errors without running the mutation', async () => {
        const { result } = renderPasswordForm();
        act(() => {
            result.current.setValue('currentPassword', 'old-password');
            result.current.setValue('newPassword', 'new-password');
            result.current.setValue('confirmNewPassword', 'different-password');
        });

        await act(async () => result.current.submit());

        await waitFor(() => {
            expect(result.current.formState.errors.confirmNewPassword?.message).toBe(
                'Passwords do not match',
            );
        });
        expect(mutateAsync).not.toHaveBeenCalled();
    });

    it.each([
        [new Error('Current password is incorrect'), 'Current password is incorrect'],
        ['request failed', 'Something went wrong.'],
    ])('maps a rejected mutation to a root form error', async (error, message) => {
        mutateAsync.mockRejectedValue(error);
        const { result } = renderPasswordForm();
        fillValidForm(result);

        await act(async () => result.current.submit());

        await waitFor(() => {
            expect(result.current.formState.errors.root?.message).toBe(message);
        });
        expect(onOpenChange).not.toHaveBeenCalled();
    });

    it('resets entered values when the dialog closes', () => {
        const { result, rerender } = renderPasswordForm();
        fillValidForm(result);

        rerender({ isOpen: false });

        expect(result.current.getValues()).toEqual({
            currentPassword: undefined,
            newPassword: undefined,
            confirmNewPassword: undefined,
        });
    });
});
