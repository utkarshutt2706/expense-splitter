import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, LogIn } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useNavigate } from 'react-router';
import { z } from 'zod';

import { useAuthStore } from '@app/stores';
import logo from '@assets/logo.svg';
import { useLogin } from '@features/auth';
import { ApiError } from '@lib/api/apiError';
import { LogoBackdrop, PasswordInput } from '@shared/components';

const loginSchema = z.object({
    email: z.email('Enter a valid email address'),
    password: z.string().min(1, 'Password is required'),
});

type LoginInput = z.infer<typeof loginSchema>;

export function LoginPage() {
    const currentUserId = useAuthStore((state) => state.currentUserId);
    const navigate = useNavigate();
    const { mutateAsync: login } = useLogin();
    const {
        register,
        handleSubmit,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

    if (currentUserId) {
        return <Navigate to="/" replace />;
    }

    const submit = handleSubmit(async (values) => {
        try {
            await login(values);
            navigate('/', { replace: true });
        } catch (error) {
            const message =
                error instanceof ApiError && error.code === 'UNAUTHORIZED'
                    ? 'Invalid email or password'
                    : 'Something went wrong logging in. Please try again.';
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
                            Sign in with your email and password.
                        </p>
                    </div>
                    <img src={logo} alt="" className="size-16" />
                </div>

                <div className="flex flex-col gap-1">
                    <label
                        htmlFor="login-email"
                        className="text-surface-foreground text-sm font-medium"
                    >
                        Email
                    </label>
                    <input
                        id="login-email"
                        type="email"
                        autoComplete="email"
                        {...register('email')}
                        className="border-border bg-surface text-surface-foreground focus-visible:ring-brand-500 rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2"
                    />
                    {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
                </div>

                <div className="flex flex-col gap-1">
                    <label
                        htmlFor="login-password"
                        className="text-surface-foreground text-sm font-medium"
                    >
                        Password
                    </label>
                    <PasswordInput
                        id="login-password"
                        autoComplete="current-password"
                        {...register('password')}
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
                        <LogIn className="size-4" />
                    )}
                    {isSubmitting ? 'Signing in…' : 'Sign in'}
                </button>

                <p className="text-muted-foreground text-center text-sm">
                    Don&apos;t have an account?{' '}
                    <Link
                        to="/register"
                        className="text-brand-600 hover:text-brand-700 font-medium"
                    >
                        Create one
                    </Link>
                </p>
            </form>
        </div>
    );
}
