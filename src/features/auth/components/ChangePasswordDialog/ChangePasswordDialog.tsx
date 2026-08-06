import { zodResolver } from '@hookform/resolvers/zod';
import { KeyRound, Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { useChangePassword } from '@features/auth/hooks/useChangePassword';
import { FormDialog, PasswordInput } from '@shared/components';

const changePasswordSchema = z
    .object({
        currentPassword: z.string().min(1, 'Enter your current password'),
        newPassword: z.string().min(8, 'Password must be at least 8 characters'),
        confirmNewPassword: z.string().min(1, 'Confirm your new password'),
    })
    .refine((values) => values.newPassword === values.confirmNewPassword, {
        message: 'Passwords do not match',
        path: ['confirmNewPassword'],
    });

type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

interface ChangePasswordDialogProps {
    readonly open: boolean;
    readonly onOpenChange: (open: boolean) => void;
}

export function ChangePasswordDialog({ open, onOpenChange }: ChangePasswordDialogProps) {
    const { mutateAsync: changePassword } = useChangePassword();
    const {
        register,
        handleSubmit,
        reset,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<ChangePasswordInput>({ resolver: zodResolver(changePasswordSchema) });

    useEffect(() => {
        if (!open) {
            reset();
        }
    }, [open, reset]);

    const submit = handleSubmit(async (values) => {
        try {
            await changePassword({
                currentPassword: values.currentPassword,
                newPassword: values.newPassword,
            });
            toast.success('Password changed');
            onOpenChange(false);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Something went wrong.';
            setError('root', { message });
        }
    });

    return (
        <FormDialog
            open={open}
            onOpenChange={onOpenChange}
            title="Change password"
            description="Enter your current password and choose a new one."
        >
            <form onSubmit={submit} noValidate className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                    <label
                        htmlFor="change-password-current"
                        className="text-surface-foreground text-sm font-medium"
                    >
                        Current password
                    </label>
                    <PasswordInput
                        id="change-password-current"
                        autoComplete="current-password"
                        {...register('currentPassword')}
                    />
                    {errors.currentPassword && (
                        <p className="text-xs text-red-600">{errors.currentPassword.message}</p>
                    )}
                </div>

                <div className="flex flex-col gap-1">
                    <label
                        htmlFor="change-password-new"
                        className="text-surface-foreground text-sm font-medium"
                    >
                        New password
                    </label>
                    <PasswordInput
                        id="change-password-new"
                        autoComplete="new-password"
                        {...register('newPassword')}
                    />
                    {errors.newPassword && (
                        <p className="text-xs text-red-600">{errors.newPassword.message}</p>
                    )}
                </div>

                <div className="flex flex-col gap-1">
                    <label
                        htmlFor="change-password-confirm"
                        className="text-surface-foreground text-sm font-medium"
                    >
                        Confirm new password
                    </label>
                    <PasswordInput
                        id="change-password-confirm"
                        autoComplete="new-password"
                        {...register('confirmNewPassword')}
                    />
                    {errors.confirmNewPassword && (
                        <p className="text-xs text-red-600">{errors.confirmNewPassword.message}</p>
                    )}
                </div>

                {errors.root && <p className="text-sm text-red-600">{errors.root.message}</p>}

                <div className="flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={() => onOpenChange(false)}
                        className="border-border text-surface-foreground hover:bg-muted cursor-pointer rounded-md border px-4 py-2 text-sm font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-brand-600 hover:bg-brand-700 inline-flex cursor-pointer items-center gap-1 rounded-md px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isSubmitting ? (
                            <Loader2 className="size-4 animate-spin" />
                        ) : (
                            <KeyRound className="size-4" />
                        )}
                        {isSubmitting ? 'Changing…' : 'Change password'}
                    </button>
                </div>
            </form>
        </FormDialog>
    );
}
