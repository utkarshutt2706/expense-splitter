import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, LogIn } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Navigate, useNavigate } from 'react-router';
import { z } from 'zod';

import { useAuthStore } from '@app/stores';
import { findUserIdForCredentials } from '@data/credentials';
import { userService } from '@services/instances';

const loginSchema = z.object({
    username: z.string().trim().min(1, 'Username is required'),
    password: z.string().min(1, 'Password is required'),
});

type LoginInput = z.infer<typeof loginSchema>;

export function LoginPage() {
    const currentUserId = useAuthStore((state) => state.currentUserId);
    const login = useAuthStore((state) => state.login);
    const setCachedUser = useAuthStore((state) => state.setCachedUser);
    const navigate = useNavigate();
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
        const userId = findUserIdForCredentials(values.username, values.password);
        if (!userId) {
            setError('root', { message: 'Invalid username or password' });
            return;
        }

        try {
            const user = await userService.getById(userId);
            setCachedUser(user);
            login(userId);
            navigate('/', { replace: true });
        } catch {
            setError('root', { message: 'Something went wrong logging in. Please try again.' });
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
                        Sign in with the username and password you were given.
                    </p>
                </div>

                <div className="flex flex-col gap-1">
                    <label
                        htmlFor="login-username"
                        className="text-surface-foreground text-sm font-medium"
                    >
                        Username
                    </label>
                    <input
                        id="login-username"
                        type="text"
                        autoComplete="username"
                        {...register('username')}
                        className="border-border bg-surface text-surface-foreground focus-visible:ring-brand-500 rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2"
                    />
                    {errors.username && (
                        <p className="text-xs text-red-600">{errors.username.message}</p>
                    )}
                </div>

                <div className="flex flex-col gap-1">
                    <label
                        htmlFor="login-password"
                        className="text-surface-foreground text-sm font-medium"
                    >
                        Password
                    </label>
                    <input
                        id="login-password"
                        type="password"
                        autoComplete="current-password"
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
                        <LogIn className="size-4" />
                    )}
                    {isSubmitting ? 'Signing in…' : 'Sign in'}
                </button>
            </form>
        </div>
    );
}
