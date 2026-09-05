import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { useChangePassword } from '@features/auth/hooks/useChangePassword';

const changePasswordSchema = z
    .object({
        currentPassword: z.string().min(1, 'Enter your current password'),
        newPassword: z
            .string()
            .min(8, 'Password must be at least 8 characters')
            .max(200, 'Password must be at most 200 characters'),
        confirmNewPassword: z.string().min(1, 'Confirm your new password'),
    })
    .refine((values) => values.newPassword === values.confirmNewPassword, {
        message: 'Passwords do not match',
        path: ['confirmNewPassword'],
    });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export type UseChangePasswordFormOptions = Readonly<{
    open: boolean;
    onOpenChange: (open: boolean) => void;
}>;

export function useChangePasswordForm({ open, onOpenChange }: UseChangePasswordFormOptions) {
    const { mutateAsync: changePassword } = useChangePassword();
    const form = useForm<ChangePasswordInput>({ resolver: zodResolver(changePasswordSchema) });
    const { reset } = form;

    useEffect(() => {
        if (!open) reset();
    }, [open, reset]);

    const submit = form.handleSubmit(async (values) => {
        try {
            await changePassword({
                currentPassword: values.currentPassword,
                newPassword: values.newPassword,
            });
            toast.success('Password changed');
            onOpenChange(false);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Something went wrong.';
            form.setError('root', { message });
        }
    });

    return { ...form, submit };
}
