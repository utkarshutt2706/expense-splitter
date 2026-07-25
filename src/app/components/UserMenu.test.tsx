import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { UserMenu } from './UserMenu';

vi.mock('../hooks/useCurrentUser', () => ({
    useCurrentUser: () => ({
        data: { id: 'current-user', name: 'Alex Morgan', email: 'alex@example.com' },
    }),
}));

describe('UserMenu', () => {
    it('shows the current user name and email', async () => {
        const user = userEvent.setup();
        render(<UserMenu />);

        await user.click(screen.getByRole('button', { name: /open user menu/i }));

        expect(screen.getByText('Alex Morgan')).toBeInTheDocument();
        expect(screen.getByText('alex@example.com')).toBeInTheDocument();
    });

    it('opens the menu with all options in order when the avatar is clicked', async () => {
        const user = userEvent.setup();
        render(<UserMenu />);

        await user.click(screen.getByRole('button', { name: /open user menu/i }));

        const content = screen.getByTestId('user-menu-content').textContent ?? '';
        const labels = ['My account', 'Settings', 'Theme', 'Logout'];
        const positions = labels.map((label) => content.indexOf(label));

        positions.forEach((position) => expect(position).toBeGreaterThanOrEqual(0));
        expect(positions).toEqual([...positions].sort((a, b) => a - b));
    });

    it('toggles the theme switch visually without navigating or throwing', async () => {
        const user = userEvent.setup();
        render(<UserMenu />);

        await user.click(screen.getByRole('button', { name: /open user menu/i }));

        const toggle = screen.getByRole('switch');
        expect(toggle).toHaveAttribute('aria-checked', 'false');

        await user.click(toggle);

        expect(toggle).toHaveAttribute('aria-checked', 'true');
    });
});
