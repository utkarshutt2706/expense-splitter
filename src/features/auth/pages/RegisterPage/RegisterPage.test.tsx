import { fireEvent, render, screen } from '@testing-library/react';
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

function renderPage(initialEntry = '/register') {
    return render(
        <MemoryRouter initialEntries={[initialEntry]}>
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
        expect(screen.getByLabelText('Password')).toBeInTheDocument();
        expect(screen.getByLabelText('Confirm password')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    });

    it('masks both password fields by default and reveals each independently via its own toggle', async () => {
        vi.mocked(useRegister).mockReturnValue({
            mutateAsync: vi.fn(),
        } as unknown as ReturnType<typeof useRegister>);
        const user = userEvent.setup();
        renderPage();

        expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
        expect(screen.getByLabelText('Confirm password')).toHaveAttribute('type', 'password');

        await user.click(screen.getAllByRole('button', { name: /show password/i })[0]!);

        expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'text');
        expect(screen.getByLabelText('Confirm password')).toHaveAttribute('type', 'password');
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
        expect(
            screen.getByText(/enter a valid 10-digit number starting with 6, 7, 8, or 9/i),
        ).toBeInTheDocument();
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
        expect(screen.getByText(/confirm your password/i)).toBeInTheDocument();
    });

    it('shows an error when the passwords do not match', async () => {
        vi.mocked(useRegister).mockReturnValue({
            mutateAsync: vi.fn(),
        } as unknown as ReturnType<typeof useRegister>);
        const user = userEvent.setup();
        renderPage();

        await user.type(screen.getByLabelText(/name/i), 'New Friend');
        await user.type(screen.getByLabelText(/email/i), 'new.friend@example.com');
        await user.type(screen.getByLabelText('Password'), 'correct-horse-battery-staple');
        await user.type(screen.getByLabelText('Confirm password'), 'a-different-password');
        await user.click(screen.getByRole('button', { name: /create account/i }));

        expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
    });

    it('enforces the API maximum lengths for names and passwords', async () => {
        const mutateAsync = vi.fn();
        vi.mocked(useRegister).mockReturnValue({
            mutateAsync,
        } as unknown as ReturnType<typeof useRegister>);
        const user = userEvent.setup();
        const oversizedValue = 'a'.repeat(201);
        renderPage();

        fireEvent.change(screen.getByLabelText(/name/i), {
            target: { value: oversizedValue },
        });
        await user.type(screen.getByLabelText(/email/i), 'new.friend@example.com');
        await user.type(screen.getByLabelText(/phone/i), '9876543210');
        fireEvent.change(screen.getByLabelText('Password'), {
            target: { value: oversizedValue },
        });
        fireEvent.change(screen.getByLabelText('Confirm password'), {
            target: { value: oversizedValue },
        });
        await user.click(screen.getByRole('button', { name: /create account/i }));

        expect(await screen.findByText('Name is too long')).toBeInTheDocument();
        expect(screen.getByText('Password must be at most 200 characters')).toBeInTheDocument();
        expect(mutateAsync).not.toHaveBeenCalled();
    });

    it('strips non-digit characters as they are typed into the phone field', async () => {
        vi.mocked(useRegister).mockReturnValue({
            mutateAsync: vi.fn(),
        } as unknown as ReturnType<typeof useRegister>);
        const user = userEvent.setup();
        renderPage();

        await user.type(screen.getByLabelText(/phone/i), '98-7654 3210');

        expect(screen.getByLabelText(/phone/i)).toHaveValue('9876543210');
    });

    it('caps the phone field at 10 digits as they are typed', async () => {
        vi.mocked(useRegister).mockReturnValue({
            mutateAsync: vi.fn(),
        } as unknown as ReturnType<typeof useRegister>);
        const user = userEvent.setup();
        renderPage();

        await user.type(screen.getByLabelText(/phone/i), '987654321099');

        expect(screen.getByLabelText(/phone/i)).toHaveValue('9876543210');
    });

    it('shows a validation error for a phone number that does not start with 6-9', async () => {
        vi.mocked(useRegister).mockReturnValue({
            mutateAsync: vi.fn(),
        } as unknown as ReturnType<typeof useRegister>);
        const user = userEvent.setup();
        renderPage();

        await user.type(screen.getByLabelText(/name/i), 'New Friend');
        await user.type(screen.getByLabelText(/email/i), 'new.friend@example.com');
        await user.type(screen.getByLabelText(/phone/i), '5876543210');
        await user.type(screen.getByLabelText('Password'), 'correct-horse-battery-staple');
        await user.type(screen.getByLabelText('Confirm password'), 'correct-horse-battery-staple');
        await user.click(screen.getByRole('button', { name: /create account/i }));

        expect(
            await screen.findByText(/enter a valid 10-digit number starting with 6, 7, 8, or 9/i),
        ).toBeInTheDocument();
    });

    it('registers with a valid phone number included in the payload', async () => {
        const mutateAsync = vi.fn().mockResolvedValue(undefined);
        vi.mocked(useRegister).mockReturnValue({
            mutateAsync,
        } as unknown as ReturnType<typeof useRegister>);
        const user = userEvent.setup();
        renderPage();

        await user.type(screen.getByLabelText(/name/i), 'New Friend');
        await user.type(screen.getByLabelText(/email/i), 'new.friend@example.com');
        await user.type(screen.getByLabelText(/phone/i), '9876543210');
        await user.type(screen.getByLabelText('Password'), 'correct-horse-battery-staple');
        await user.type(screen.getByLabelText('Confirm password'), 'correct-horse-battery-staple');
        await user.click(screen.getByRole('button', { name: /create account/i }));

        expect(await screen.findByText(/home page/i)).toBeInTheDocument();
        expect(mutateAsync).toHaveBeenCalledWith({
            name: 'New Friend',
            email: 'new.friend@example.com',
            phone: '9876543210',
            password: 'correct-horse-battery-staple',
        });
    });

    it('requires a phone number before registration can continue', async () => {
        const mutateAsync = vi.fn().mockResolvedValue(undefined);
        vi.mocked(useRegister).mockReturnValue({
            mutateAsync,
        } as unknown as ReturnType<typeof useRegister>);
        const user = userEvent.setup();
        renderPage();

        await user.type(screen.getByLabelText(/name/i), 'New Friend');
        await user.type(screen.getByLabelText(/email/i), 'new.friend@example.com');
        await user.type(screen.getByLabelText('Password'), 'correct-horse-battery-staple');
        await user.type(screen.getByLabelText('Confirm password'), 'correct-horse-battery-staple');
        await user.click(screen.getByRole('button', { name: /create account/i }));

        expect(
            await screen.findByText(/enter a valid 10-digit number starting with 6, 7, 8, or 9/i),
        ).toBeInTheDocument();
        expect(mutateAsync).not.toHaveBeenCalled();
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
        await user.type(screen.getByLabelText(/phone/i), '9876543210');
        await user.type(screen.getByLabelText('Password'), 'correct-horse-battery-staple');
        await user.type(screen.getByLabelText('Confirm password'), 'correct-horse-battery-staple');
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
        await user.type(screen.getByLabelText(/phone/i), '9876543210');
        await user.type(screen.getByLabelText('Password'), 'correct-horse-battery-staple');
        await user.type(screen.getByLabelText('Confirm password'), 'correct-horse-battery-staple');
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
