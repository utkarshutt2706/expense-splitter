import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore, useThemeStore, useThemeTransitionStore } from '@app/stores';
import { logout as revokeSession } from '@features/auth/api/authApi';
import { UserMenu } from './UserMenu';

const { currentUser } = vi.hoisted(() => ({
    currentUser: {
        value: { id: 'current-user', name: 'Alex Morgan', email: 'alex@example.com' } as
            { id: string; name: string; email: string } | undefined,
    },
}));

vi.mock('@app/hooks', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@app/hooks')>()),
    useCurrentUser: () => ({
        data: currentUser.value,
    }),
}));

vi.mock('@features/auth', () => ({
    ChangePasswordDialog: ({ open }: { open: boolean }) =>
        open ? <div data-testid="change-password-dialog" /> : null,
}));

vi.mock('@features/auth/api/authApi', () => ({
    logout: vi.fn().mockResolvedValue(undefined),
}));

function renderMenu(expanded = false) {
    return render(
        <MemoryRouter initialEntries={['/']}>
            <Routes>
                <Route path="/" element={<UserMenu expanded={expanded} />} />
                <Route path="/login" element={<p>login page</p>} />
            </Routes>
        </MemoryRouter>,
    );
}

describe('UserMenu', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        useAuthStore.setState({ currentUserId: 'current-user' });
        useThemeStore.setState({ theme: 'light' });
        useThemeTransitionStore.setState({ direction: null });
        currentUser.value = {
            id: 'current-user',
            name: 'Alex Morgan',
            email: 'alex@example.com',
        };
    });

    it('shows the current user name and email inside the popover', async () => {
        const user = userEvent.setup();
        renderMenu();

        await user.click(screen.getByRole('button', { name: /open user menu/i }));

        const content = within(screen.getByTestId('user-menu-content'));
        expect(content.getByText('Alex Morgan')).toBeInTheDocument();
        expect(content.getByText('alex@example.com')).toBeInTheDocument();
    });

    it('renders safely while current-user data is unavailable', async () => {
        currentUser.value = undefined;
        const user = userEvent.setup();
        renderMenu();

        const trigger = screen.getByRole('button', { name: /open user menu/i });
        expect(trigger).toHaveTextContent('');
        await user.click(trigger);

        expect(screen.getByTestId('user-menu-content')).toBeInTheDocument();
    });

    it('opens the menu with all options in order when the avatar is clicked', async () => {
        const user = userEvent.setup();
        renderMenu();

        await user.click(screen.getByRole('button', { name: /open user menu/i }));

        const content = screen.getByTestId('user-menu-content').textContent ?? '';
        const labels = ['My account', 'Settings', 'Change password', 'Theme', 'Logout'];
        const positions = labels.map((label) => content.indexOf(label));

        positions.forEach((position) => expect(position).toBeGreaterThanOrEqual(0));
        expect(positions).toEqual([...positions].sort((a, b) => a - b));
    });

    it('toggles the real theme preference when the theme switch is clicked', async () => {
        const user = userEvent.setup();
        renderMenu();

        await user.click(screen.getByRole('button', { name: /open user menu/i }));

        const toggle = screen.getByRole('switch');
        expect(toggle).toHaveAttribute('aria-checked', 'false');

        await user.click(toggle);

        expect(toggle).toHaveAttribute('aria-checked', 'true');
        expect(useThemeStore.getState().theme).toBe('dark');
        expect(useThemeTransitionStore.getState().direction).toBe('dark');

        await user.click(toggle);

        expect(toggle).toHaveAttribute('aria-checked', 'false');
        expect(useThemeStore.getState().theme).toBe('light');
        expect(useThemeTransitionStore.getState().direction).toBe('light');
    });

    it('reflects the persisted theme preference as the switch state on open', async () => {
        useThemeStore.setState({ theme: 'dark' });
        const user = userEvent.setup();
        renderMenu();

        await user.click(screen.getByRole('button', { name: /open user menu/i }));

        expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
    });

    it('opens the change password dialog and closes the menu when Change password is clicked', async () => {
        const user = userEvent.setup();
        renderMenu();

        await user.click(screen.getByRole('button', { name: /open user menu/i }));
        await user.click(screen.getByRole('button', { name: /change password/i }));

        expect(screen.getByTestId('change-password-dialog')).toBeInTheDocument();
        expect(screen.queryByTestId('user-menu-content')).not.toBeInTheDocument();
    });

    it('logs out and navigates to the login page when Logout is clicked', async () => {
        const user = userEvent.setup();
        renderMenu();

        await user.click(screen.getByRole('button', { name: /open user menu/i }));
        await user.click(screen.getByRole('button', { name: /logout/i }));

        expect(useAuthStore.getState().currentUserId).toBeNull();
        expect(revokeSession).toHaveBeenCalledOnce();
        expect(await screen.findByText(/login page/i)).toBeInTheDocument();
    });

    it('still clears the session and navigates when server logout fails', async () => {
        vi.mocked(revokeSession).mockRejectedValueOnce(new Error('server unavailable'));
        const user = userEvent.setup();
        renderMenu();

        await user.click(screen.getByRole('button', { name: /open user menu/i }));
        await user.click(screen.getByRole('button', { name: /logout/i }));

        expect(await screen.findByText(/login page/i)).toBeInTheDocument();
        expect(useAuthStore.getState().currentUserId).toBeNull();
    });

    it('hides the trigger name and email when collapsed', () => {
        renderMenu(false);

        expect(screen.getByText('Alex Morgan').parentElement?.className).toContain('hidden');
    });

    it('shows the trigger name and email when expanded', () => {
        renderMenu(true);

        expect(screen.getByText('Alex Morgan').parentElement?.className).not.toContain('hidden');
    });

    it('gives the trigger extra padding when expanded', () => {
        const { rerender } = renderMenu(false);

        const trigger = screen.getByRole('button', { name: /open user menu/i });
        expect(trigger.className.split(/\s+/)).not.toContain('px-3');

        rerender(
            <MemoryRouter initialEntries={['/']}>
                <Routes>
                    <Route path="/" element={<UserMenu expanded={true} />} />
                    <Route path="/login" element={<p>login page</p>} />
                </Routes>
            </MemoryRouter>,
        );

        expect(trigger.className.split(/\s+/)).toContain('px-3');
        expect(trigger.className.split(/\s+/)).toContain('py-2');
    });
});
