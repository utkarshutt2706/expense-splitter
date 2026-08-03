import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '@app/stores';
import { useLogin } from '@features/auth';
import { ApiError } from '@lib/api/apiError';
import { LoginPage } from './LoginPage';

vi.mock('@features/auth', () => ({
    useLogin: vi.fn(),
}));

function renderPage() {
    return render(
        <MemoryRouter initialEntries={['/login']}>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/" element={<div>Home page</div>} />
            </Routes>
        </MemoryRouter>,
    );
}

describe('LoginPage', () => {
    beforeEach(() => {
        localStorage.clear();
        useAuthStore.setState({ currentUserId: null, cachedUser: null, accessToken: null });
    });

    it('renders the login form', () => {
        vi.mocked(useLogin).mockReturnValue({
            mutateAsync: vi.fn(),
        } as unknown as ReturnType<typeof useLogin>);

        renderPage();

        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('shows validation errors when submitted empty', async () => {
        vi.mocked(useLogin).mockReturnValue({
            mutateAsync: vi.fn(),
        } as unknown as ReturnType<typeof useLogin>);
        const user = userEvent.setup();
        renderPage();

        await user.click(screen.getByRole('button', { name: /sign in/i }));

        expect(await screen.findByText(/enter a valid email address/i)).toBeInTheDocument();
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });

    it('shows an error and does not log in when credentials are wrong', async () => {
        const mutateAsync = vi
            .fn()
            .mockRejectedValue(new ApiError('UNAUTHORIZED', 'Invalid email or password', 401));
        vi.mocked(useLogin).mockReturnValue({
            mutateAsync,
        } as unknown as ReturnType<typeof useLogin>);
        const user = userEvent.setup();
        renderPage();

        await user.type(screen.getByLabelText(/email/i), 'utkarsh@example.com');
        await user.type(screen.getByLabelText(/password/i), 'wrong-password');
        await user.click(screen.getByRole('button', { name: /sign in/i }));

        expect(await screen.findByText(/invalid email or password/i)).toBeInTheDocument();
        expect(useAuthStore.getState().currentUserId).toBeNull();
    });

    it('logs in and navigates to the home page on correct credentials', async () => {
        const mutateAsync = vi.fn().mockResolvedValue(undefined);
        vi.mocked(useLogin).mockReturnValue({
            mutateAsync,
        } as unknown as ReturnType<typeof useLogin>);
        const user = userEvent.setup();
        renderPage();

        await user.type(screen.getByLabelText(/email/i), 'utkarsh@example.com');
        await user.type(screen.getByLabelText(/password/i), 'correct-horse-battery-staple');
        await user.click(screen.getByRole('button', { name: /sign in/i }));

        expect(await screen.findByText(/home page/i)).toBeInTheDocument();
        expect(mutateAsync).toHaveBeenCalledWith({
            email: 'utkarsh@example.com',
            password: 'correct-horse-battery-staple',
        });
    });

    it('shows a loading state on the submit button while signing in', async () => {
        let resolveLogin: () => void = () => {};
        const mutateAsync = vi.fn().mockImplementation(
            () =>
                new Promise<void>((resolve) => {
                    resolveLogin = resolve;
                }),
        );
        vi.mocked(useLogin).mockReturnValue({
            mutateAsync,
        } as unknown as ReturnType<typeof useLogin>);
        const user = userEvent.setup();
        renderPage();

        await user.type(screen.getByLabelText(/email/i), 'utkarsh@example.com');
        await user.type(screen.getByLabelText(/password/i), 'correct-horse-battery-staple');
        await user.click(screen.getByRole('button', { name: /sign in/i }));

        const submitButton = await screen.findByRole('button', { name: /signing in/i });
        expect(submitButton).toBeDisabled();

        resolveLogin();

        expect(await screen.findByText(/home page/i)).toBeInTheDocument();
    });

    it('shows a generic error when login fails for a reason other than bad credentials', async () => {
        const mutateAsync = vi.fn().mockRejectedValue(new Error('network down'));
        vi.mocked(useLogin).mockReturnValue({
            mutateAsync,
        } as unknown as ReturnType<typeof useLogin>);
        const user = userEvent.setup();
        renderPage();

        await user.type(screen.getByLabelText(/email/i), 'utkarsh@example.com');
        await user.type(screen.getByLabelText(/password/i), 'correct-horse-battery-staple');
        await user.click(screen.getByRole('button', { name: /sign in/i }));

        expect(await screen.findByText(/something went wrong logging in/i)).toBeInTheDocument();
        expect(useAuthStore.getState().currentUserId).toBeNull();
    });

    it('redirects to the home page when already logged in', () => {
        vi.mocked(useLogin).mockReturnValue({
            mutateAsync: vi.fn(),
        } as unknown as ReturnType<typeof useLogin>);
        useAuthStore.setState({ currentUserId: 'current-user' });

        renderPage();

        expect(screen.getByText(/home page/i)).toBeInTheDocument();
    });

    it('links to the register page', () => {
        vi.mocked(useLogin).mockReturnValue({
            mutateAsync: vi.fn(),
        } as unknown as ReturnType<typeof useLogin>);

        renderPage();

        expect(screen.getByRole('link', { name: /create one/i })).toHaveAttribute(
            'href',
            '/register',
        );
    });
});
