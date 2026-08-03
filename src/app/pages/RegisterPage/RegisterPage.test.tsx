import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '@app/stores';
import { useRegister } from '@features/auth';
import { ApiError } from '@lib/api/apiError';
import { RegisterPage } from './RegisterPage';

vi.mock('@features/auth', () => ({
    useRegister: vi.fn(),
}));

function renderPage() {
    return render(
        <MemoryRouter initialEntries={['/register']}>
            <Routes>
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/" element={<div>Home page</div>} />
            </Routes>
        </MemoryRouter>,
    );
}

describe('RegisterPage', () => {
    beforeEach(() => {
        localStorage.clear();
        useAuthStore.setState({ currentUserId: null, cachedUser: null, accessToken: null });
    });

    it('renders the registration form', () => {
        vi.mocked(useRegister).mockReturnValue({
            mutateAsync: vi.fn(),
        } as unknown as ReturnType<typeof useRegister>);

        renderPage();

        expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    });

    it('shows validation errors when submitted empty', async () => {
        vi.mocked(useRegister).mockReturnValue({
            mutateAsync: vi.fn(),
        } as unknown as ReturnType<typeof useRegister>);
        const user = userEvent.setup();
        renderPage();

        await user.click(screen.getByRole('button', { name: /create account/i }));

        expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/enter a valid email address/i)).toBeInTheDocument();
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
    });

    it('registers, omitting an empty optional phone, and navigates to the home page', async () => {
        const mutateAsync = vi.fn().mockResolvedValue(undefined);
        vi.mocked(useRegister).mockReturnValue({
            mutateAsync,
        } as unknown as ReturnType<typeof useRegister>);
        const user = userEvent.setup();
        renderPage();

        await user.type(screen.getByLabelText(/name/i), 'New Friend');
        await user.type(screen.getByLabelText(/email/i), 'new.friend@example.com');
        await user.type(screen.getByLabelText(/password/i), 'correct-horse-battery-staple');
        await user.click(screen.getByRole('button', { name: /create account/i }));

        expect(await screen.findByText(/home page/i)).toBeInTheDocument();
        expect(mutateAsync).toHaveBeenCalledWith({
            name: 'New Friend',
            email: 'new.friend@example.com',
            phone: undefined,
            password: 'correct-horse-battery-staple',
        });
    });

    it('shows the server error message when the email is already in use', async () => {
        const mutateAsync = vi
            .fn()
            .mockRejectedValue(
                new ApiError('CONFLICT', 'A user with this email already exists', 409),
            );
        vi.mocked(useRegister).mockReturnValue({
            mutateAsync,
        } as unknown as ReturnType<typeof useRegister>);
        const user = userEvent.setup();
        renderPage();

        await user.type(screen.getByLabelText(/name/i), 'New Friend');
        await user.type(screen.getByLabelText(/email/i), 'taken@example.com');
        await user.type(screen.getByLabelText(/password/i), 'correct-horse-battery-staple');
        await user.click(screen.getByRole('button', { name: /create account/i }));

        expect(
            await screen.findByText(/a user with this email already exists/i),
        ).toBeInTheDocument();
        expect(useAuthStore.getState().currentUserId).toBeNull();
    });

    it('shows a generic error when registration fails for a reason other than a conflict', async () => {
        const mutateAsync = vi.fn().mockRejectedValue(new Error('network down'));
        vi.mocked(useRegister).mockReturnValue({
            mutateAsync,
        } as unknown as ReturnType<typeof useRegister>);
        const user = userEvent.setup();
        renderPage();

        await user.type(screen.getByLabelText(/name/i), 'New Friend');
        await user.type(screen.getByLabelText(/email/i), 'new.friend@example.com');
        await user.type(screen.getByLabelText(/password/i), 'correct-horse-battery-staple');
        await user.click(screen.getByRole('button', { name: /create account/i }));

        expect(
            await screen.findByText(/something went wrong creating your account/i),
        ).toBeInTheDocument();
    });

    it('redirects to the home page when already logged in', () => {
        vi.mocked(useRegister).mockReturnValue({
            mutateAsync: vi.fn(),
        } as unknown as ReturnType<typeof useRegister>);
        useAuthStore.setState({ currentUserId: 'current-user' });

        renderPage();

        expect(screen.getByText(/home page/i)).toBeInTheDocument();
    });

    it('links to the login page', () => {
        vi.mocked(useRegister).mockReturnValue({
            mutateAsync: vi.fn(),
        } as unknown as ReturnType<typeof useRegister>);

        renderPage();

        expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute('href', '/login');
    });
});
