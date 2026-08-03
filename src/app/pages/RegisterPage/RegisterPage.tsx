import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, UserPlus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useNavigate } from 'react-router';
import { z } from 'zod';

import { useAuthStore } from '@app/stores';
import { useRegister } from '@features/auth';
import { ApiError } from '@lib/api/apiError';

const registerSchema = z.object({
    name: z.string().trim().min(1, 'Name is required'),
    email: z.email('Enter a valid email address'),
    phone: z.string().trim().optional(),
    password: z.string().min(8, 'Password must be at least 8 characters'),
});

type RegisterInput = z.infer<typeof registerSchema>;

export function RegisterPage() {
    const currentUserId = useAuthStore((state) => state.currentUserId);
    const navigate = useNavigate();
    const { mutateAsync: registerUser } = useRegister();
    const {
        register,
        handleSubmit,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

    if (currentUserId) {
        return <Navigate to="/" replace />;
    }

    const submit = handleSubmit(async (values) => {
        try {
            await registerUser({ ...values, phone: values.phone || undefined });
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
        <div className="bg-surface flex min-h-svh items-center justify-center p-4">
            <form
                onSubmit={submit}
                noValidate
                className="border-border bg-surface flex w-full max-w-sm flex-col gap-4 rounded-lg border p-6 shadow-lg"
            >
                <div>
                    <h1 className="font-display text-surface-foreground text-xl font-medium">
                        Expense Splitter
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Create an account to get started.
                    </p>
                </div>

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
                        {...register('email')}
                        className="border-border bg-surface text-surface-foreground focus-visible:ring-brand-500 rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2"
                    />
                    {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
                </div>

                <div className="flex flex-col gap-1">
                    <label
                        htmlFor="register-phone"
                        className="text-surface-foreground text-sm font-medium"
                    >
                        Phone <span className="text-muted-foreground font-normal">(optional)</span>
                    </label>
                    <input
                        id="register-phone"
                        type="tel"
                        autoComplete="tel"
                        {...register('phone')}
                        className="border-border bg-surface text-surface-foreground focus-visible:ring-brand-500 rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2"
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <label
                        htmlFor="register-password"
                        className="text-surface-foreground text-sm font-medium"
                    >
                        Password
                    </label>
                    <input
                        id="register-password"
                        type="password"
                        autoComplete="new-password"
                        {...register('password')}
                        className="border-border bg-surface text-surface-foreground focus-visible:ring-brand-500 rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2"
                    />
                    {errors.password && (
                        <p className="text-xs text-red-600">{errors.password.message}</p>
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
