import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '@app/stores';
import type { User } from '@data/entities';
import { CURRENT_USER_ID } from '@data/seed';
import { LoginPage } from './LoginPage';

vi.mock('@services/instances', () => ({
    userService: {
        getById: vi.fn(),
    },
}));

const utkarsh: User = {
    id: CURRENT_USER_ID,
    name: 'Utkarsh Srivastava',
    email: 'utkarsh@example.com',
};

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
        useAuthStore.setState({ currentUserId: null, cachedUser: null });
    });

    it('renders the login form', () => {
        renderPage();

        expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('shows validation errors when submitted empty', async () => {
        const user = userEvent.setup();
        renderPage();

        await user.click(screen.getByRole('button', { name: /sign in/i }));

        expect(await screen.findByText(/username is required/i)).toBeInTheDocument();
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });

    it('shows an error and does not log in when credentials are wrong', async () => {
        const user = userEvent.setup();
        renderPage();

        await user.type(screen.getByLabelText(/username/i), 'utkarsh');
        await user.type(screen.getByLabelText(/password/i), 'wrong-password');
        await user.click(screen.getByRole('button', { name: /sign in/i }));

        expect(await screen.findByText(/invalid username or password/i)).toBeInTheDocument();
        expect(useAuthStore.getState().currentUserId).toBeNull();
    });

    it('logs in, caches the full user record, and navigates to the home page on correct credentials', async () => {
        const { userService } = await import('@services/instances');
        vi.mocked(userService.getById).mockResolvedValue(utkarsh);
        const user = userEvent.setup();
        renderPage();

        await user.type(screen.getByLabelText(/username/i), 'utkarsh');
        await user.type(screen.getByLabelText(/password/i), 'changeme-utkarsh');
        await user.click(screen.getByRole('button', { name: /sign in/i }));

        expect(await screen.findByText(/home page/i)).toBeInTheDocument();
        expect(userService.getById).toHaveBeenCalledWith(CURRENT_USER_ID);
        expect(useAuthStore.getState().currentUserId).toBe(CURRENT_USER_ID);
        expect(useAuthStore.getState().cachedUser).toEqual(utkarsh);
    });

    it('shows a loading state on the submit button while signing in', async () => {
        const { userService } = await import('@services/instances');
        let resolveGetById: (value: User) => void = () => {};
        vi.mocked(userService.getById).mockImplementation(
            () =>
                new Promise((resolve) => {
                    resolveGetById = resolve;
                }),
        );
        const user = userEvent.setup();
        renderPage();

        await user.type(screen.getByLabelText(/username/i), 'utkarsh');
        await user.type(screen.getByLabelText(/password/i), 'changeme-utkarsh');
        await user.click(screen.getByRole('button', { name: /sign in/i }));

        const submitButton = await screen.findByRole('button', { name: /signing in/i });
        expect(submitButton).toBeDisabled();

        resolveGetById(utkarsh);

        expect(await screen.findByText(/home page/i)).toBeInTheDocument();
    });

    it('shows an error and does not log in when fetching the user record fails', async () => {
        const { userService } = await import('@services/instances');
        vi.mocked(userService.getById).mockRejectedValue(new Error('not found'));
        const user = userEvent.setup();
        renderPage();

        await user.type(screen.getByLabelText(/username/i), 'utkarsh');
        await user.type(screen.getByLabelText(/password/i), 'changeme-utkarsh');
        await user.click(screen.getByRole('button', { name: /sign in/i }));

        expect(await screen.findByText(/something went wrong logging in/i)).toBeInTheDocument();
        expect(useAuthStore.getState().currentUserId).toBeNull();
    });

    it('redirects to the home page when already logged in', () => {
        useAuthStore.setState({ currentUserId: CURRENT_USER_ID });

        renderPage();

        expect(screen.getByText(/home page/i)).toBeInTheDocument();
    });
});
