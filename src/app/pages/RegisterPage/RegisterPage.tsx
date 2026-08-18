import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, UserPlus } from 'lucide-react';
import type { ChangeEvent } from 'react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router';
import { z } from 'zod';

import { useAuthStore } from '@app/stores';
import logo from '@assets/logo.svg';
import { useRegister } from '@features/auth';
import { useValidateInvitation } from '@features/invitations';
import { ApiError } from '@lib/api/apiError';
import { LogoBackdrop, PasswordInput } from '@shared/components';
import { sanitizePhoneInput } from '@shared/utils';

const registerSchema = z
    .object({
        name: z.string().trim().min(1, 'Name is required'),
        email: z.email('Enter a valid email address'),
        phone: z
            .string()
            .trim()
            .regex(/^[6-9]\d{9}$/, {
                message: 'Enter a valid 10-digit number starting with 6, 7, 8, or 9',
            }),
        password: z.string().min(8, 'Password must be at least 8 characters'),
        confirmPassword: z.string().min(1, 'Confirm your password'),
    })
    .refine((values) => values.password === values.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    });

type RegisterInput = z.infer<typeof registerSchema>;

export function RegisterPage() {
    const currentUserId = useAuthStore((state) => state.currentUserId);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const inviteToken = searchParams.get('invite');
    const {
        data: invitation,
        isLoading: isValidatingInvite,
        isError: isInviteInvalid,
    } = useValidateInvitation(inviteToken);
    const { mutateAsync: registerUser } = useRegister();
    const {
        register,
        handleSubmit,
        setValue,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

    useEffect(() => {
        if (invitation) {
            setValue('email', invitation.email, { shouldValidate: true });
        }
    }, [invitation, setValue]);

    if (currentUserId) {
        return <Navigate to="/" replace />;
    }

    const submit = handleSubmit(async (values) => {
        try {
            await registerUser({
                name: values.name,
                email: values.email,
                password: values.password,
                phone: values.phone,
                inviteToken: invitation && inviteToken ? inviteToken : undefined,
            });
            navigate('/', { replace: true });
        } catch (error) {
            const message =
                error instanceof ApiError && error.code === 'CONFLICT'
                    ? error.message
                    : 'Something went wrong creating your account. Please try again.';
            setError('root', { message });
        }
    });

    return (
        <div className="bg-surface relative flex min-h-svh items-center justify-center overflow-hidden p-4">
            <LogoBackdrop />

            <form
                onSubmit={submit}
                noValidate
                className="border-border bg-surface relative flex w-full max-w-sm flex-col gap-4 rounded-lg border p-6 shadow-lg"
            >
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="font-display text-surface-foreground text-xl font-medium">
                            Expense Splitter
                        </h1>
                        <p className="text-muted-foreground mt-1 text-sm">
                            Create an account to get started.
                        </p>
                    </div>
                    <img src={logo} alt="" className="size-16" />
                </div>

                {invitation && (
                    <p className="bg-brand-50 text-brand-700 border-brand-200 rounded-md border px-3 py-2 text-sm">
                        <strong>{invitation.inviterName}</strong> invited you to Expense Splitter —
                        sign up with <strong>{invitation.email}</strong> to join group{' '}
                        <strong>"{invitation.group.name}"</strong> automatically.
                    </p>
                )}
                {inviteToken && !isValidatingInvite && isInviteInvalid && (
                    <p className="text-muted-foreground text-xs">
                        This invite link has expired or is no longer valid. You can still create an
                        account below.
                    </p>
                )}

                <div className="flex flex-col gap-1">
                    <label
                        htmlFor="register-name"
                        className="text-surface-foreground text-sm font-medium"
                    >
                        Name
                    </label>
                    <input
                        id="register-name"
                        type="text"
                        autoComplete="name"
                        {...register('name')}
                        className="border-border bg-surface text-surface-foreground focus-visible:ring-brand-500 rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2"
                    />
                    {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
                </div>

                <div className="flex flex-col gap-1">
                    <label
                        htmlFor="register-email"
                        className="text-surface-foreground text-sm font-medium"
                    >
                        Email
                    </label>
                    <input
                        id="register-email"
                        type="email"
                        autoComplete="email"
                        readOnly={Boolean(invitation)}
                        {...register('email')}
                        className={`border-border text-surface-foreground focus-visible:ring-brand-500 rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2 ${invitation ? 'bg-muted cursor-not-allowed' : 'bg-surface'}`}
                    />
                    {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
                </div>

                <div className="flex flex-col gap-1">
                    <label
                        htmlFor="register-phone"
                        className="text-surface-foreground text-sm font-medium"
                    >
                        Phone
                    </label>
                    <input
                        id="register-phone"
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel"
                        maxLength={10}
                        {...register('phone', {
                            onChange: (event: ChangeEvent<HTMLInputElement>) => {
                                event.target.value = sanitizePhoneInput(event.target.value);
                            },
                        })}
                        className="border-border bg-surface text-surface-foreground focus-visible:ring-brand-500 rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2"
                    />
                    {errors.phone && <p className="text-xs text-red-600">{errors.phone.message}</p>}
                </div>

                <div className="flex flex-col gap-1">
                    <label
                        htmlFor="register-password"
                        className="text-surface-foreground text-sm font-medium"
                    >
                        Password
                    </label>
                    <PasswordInput
                        id="register-password"
                        autoComplete="new-password"
                        {...register('password')}
                    />
                    {errors.password && (
                        <p className="text-xs text-red-600">{errors.password.message}</p>
                    )}
                </div>

                <div className="flex flex-col gap-1">
                    <label
                        htmlFor="register-confirm-password"
                        className="text-surface-foreground text-sm font-medium"
                    >
                        Confirm password
                    </label>
                    <PasswordInput
                        id="register-confirm-password"
                        autoComplete="new-password"
                        {...register('confirmPassword')}
                    />
                    {errors.confirmPassword && (
                        <p className="text-xs text-red-600">{errors.confirmPassword.message}</p>
                    )}
                </div>

                {errors.root && <p className="text-sm text-red-600">{errors.root.message}</p>}

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-brand-600 hover:bg-brand-700 inline-flex cursor-pointer items-center justify-center gap-1 rounded-md px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isSubmitting ? (
                        <Loader2 className="size-4 animate-spin" />
                    ) : (
                        <UserPlus className="size-4" />
                    )}
                    {isSubmitting ? 'Creating account…' : 'Create account'}
                </button>

                <p className="text-muted-foreground text-center text-sm">
                    Already have an account?{' '}
                    <Link to="/login" className="text-brand-600 hover:text-brand-700 font-medium">
                        Sign in
                    </Link>
                </p>
            </form>
        </div>
    );
}
