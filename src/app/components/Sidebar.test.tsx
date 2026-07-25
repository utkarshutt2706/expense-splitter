import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { Sidebar } from './Sidebar';

vi.mock('../hooks/useCurrentUser', () => ({
    useCurrentUser: () => ({
        data: { id: 'current-user', name: 'Alex Morgan', email: 'alex@example.com' },
    }),
}));

describe('Sidebar', () => {
    it('links the app title back to the root path', () => {
        render(
            <MemoryRouter>
                <Sidebar />
            </MemoryRouter>,
        );

        expect(screen.getByRole('link', { name: /expense splitter/i })).toHaveAttribute(
            'href',
            '/',
        );
    });

    it('renders a link for each nav item', () => {
        render(
            <MemoryRouter>
                <Sidebar />
            </MemoryRouter>,
        );

        expect(screen.getByRole('link', { name: /dashboard/i })).toHaveAttribute('href', '/');
        expect(screen.getByRole('link', { name: /friends/i })).toHaveAttribute('href', '/friends');
        expect(screen.getByRole('link', { name: /groups/i })).toHaveAttribute('href', '/groups');
        expect(screen.getByRole('link', { name: /activity/i })).toHaveAttribute(
            'href',
            '/activity',
        );
        expect(screen.queryByRole('link', { name: /settings/i })).not.toBeInTheDocument();
    });

    it('marks the matching route as active', () => {
        render(
            <MemoryRouter initialEntries={['/friends']}>
                <Sidebar />
            </MemoryRouter>,
        );

        expect(screen.getByRole('link', { name: /friends/i })).toHaveAttribute(
            'aria-current',
            'page',
        );
        expect(screen.getByRole('link', { name: /dashboard/i })).not.toHaveAttribute(
            'aria-current',
        );
    });

    it('starts collapsed, with nav labels hidden and the collapse toggle labeled to expand', () => {
        render(
            <MemoryRouter>
                <Sidebar />
            </MemoryRouter>,
        );

        expect(screen.getByRole('button', { name: /expand sidebar/i })).toBeInTheDocument();
        expect(screen.getByText('Dashboard').className).toContain('hidden');
    });

    it('reveals nav labels and flips the toggle label when expanded', async () => {
        const user = userEvent.setup();
        render(
            <MemoryRouter>
                <Sidebar />
            </MemoryRouter>,
        );

        await user.click(screen.getByRole('button', { name: /expand sidebar/i }));

        expect(screen.getByRole('button', { name: /collapse sidebar/i })).toBeInTheDocument();
        expect(screen.getByText('Dashboard').className).not.toContain('hidden');
    });

    it('renders the user menu trigger at the bottom of the sidebar', () => {
        render(
            <MemoryRouter>
                <Sidebar />
            </MemoryRouter>,
        );

        expect(screen.getByRole('button', { name: /open user menu/i })).toBeInTheDocument();
    });

    it('adds a separator above the user menu once expanded', async () => {
        const user = userEvent.setup();
        render(
            <MemoryRouter>
                <Sidebar />
            </MemoryRouter>,
        );

        const wrapper = screen.getByRole('button', { name: /open user menu/i }).parentElement;
        const classTokens = () => wrapper?.className.split(/\s+/) ?? [];

        expect(classTokens()).not.toContain('border-t');

        await user.click(screen.getByRole('button', { name: /expand sidebar/i }));

        expect(classTokens()).toContain('border-t');
    });

    it('widens the aside from a collapsed rail to full width once expanded', async () => {
        const user = userEvent.setup();
        render(
            <MemoryRouter>
                <Sidebar />
            </MemoryRouter>,
        );

        const aside = screen.getByRole('complementary');
        const classTokens = () => aside.className.split(/\s+/);

        expect(classTokens()).toContain('w-16');
        expect(classTokens()).not.toContain('w-64');

        await user.click(screen.getByRole('button', { name: /expand sidebar/i }));

        expect(classTokens()).toContain('w-64');
        expect(classTokens()).not.toContain('w-16');
    });

    it('reveals the user menu name and email once the sidebar is expanded', async () => {
        const user = userEvent.setup();
        render(
            <MemoryRouter>
                <Sidebar />
            </MemoryRouter>,
        );

        expect(screen.getByText('Alex Morgan').parentElement?.className).toContain('hidden');

        await user.click(screen.getByRole('button', { name: /expand sidebar/i }));

        expect(screen.getByText('Alex Morgan').parentElement?.className).not.toContain('hidden');
    });
});
