import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { navItems } from '@app/configs/navigation';
import { Sidebar } from './Sidebar';

vi.mock('@app/hooks', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@app/hooks')>()),
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

        expect(screen.getByRole('link', { name: /dashboard/i })).toHaveAttribute(
            'href',
            '/dashboard',
        );
        expect(screen.getByRole('link', { name: /friends/i })).toHaveAttribute('href', '/friends');
        expect(screen.getByRole('link', { name: /groups/i })).toHaveAttribute('href', '/groups');
        expect(screen.getByRole('link', { name: /analytics/i })).toHaveAttribute(
            'href',
            '/analytics',
        );
        expect(screen.getByRole('link', { name: /activity/i })).toHaveAttribute(
            'href',
            '/activity',
        );
        expect(screen.queryByRole('link', { name: /settings/i })).not.toBeInTheDocument();
        const links = screen.getByRole('navigation', { name: 'Main' }).querySelectorAll('a');
        expect([...links].map((link) => link.textContent?.trim())).toEqual(
            navItems.map(({ label }) => label),
        );
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

    it('swaps the hamburger icon for a close icon when expanded', async () => {
        const user = userEvent.setup();
        render(
            <MemoryRouter>
                <Sidebar />
            </MemoryRouter>,
        );

        const toggle = () => screen.getByRole('button', { name: /(expand|collapse) sidebar/i });
        expect(toggle().querySelector('svg')?.classList).toContain('lucide-menu');

        await user.click(toggle());

        expect(toggle().querySelector('svg')?.classList).toContain('lucide-x');
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
        expect(classTokens()).not.toContain('w-72');

        await user.click(screen.getByRole('button', { name: /expand sidebar/i }));

        expect(classTokens()).toContain('w-72');
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

    it('reveals the brand logo and title once the sidebar is expanded', async () => {
        const user = userEvent.setup();
        render(
            <MemoryRouter>
                <Sidebar />
            </MemoryRouter>,
        );

        const brandLink = () => screen.getByRole('link', { name: /expense splitter/i });
        const classTokens = () => brandLink().className.split(/\s+/);

        expect(classTokens()).toContain('hidden');
        expect(classTokens()).not.toContain('flex');

        await user.click(screen.getByRole('button', { name: /expand sidebar/i }));

        expect(classTokens()).toContain('flex');
        expect(classTokens()).not.toContain('hidden');
    });

    it('stays a fixed overlay in both collapsed and expanded states, so it never resizes the main content', async () => {
        const user = userEvent.setup();
        render(
            <MemoryRouter>
                <Sidebar />
            </MemoryRouter>,
        );

        const aside = screen.getByRole('complementary');
        const classTokens = () => aside.className.split(/\s+/);

        expect(classTokens()).toContain('fixed');

        await user.click(screen.getByRole('button', { name: /expand sidebar/i }));

        expect(classTokens()).toContain('fixed');
    });

    it('shows a backdrop only while expanded, and closes the sidebar when it is clicked', async () => {
        const user = userEvent.setup();
        const { container } = render(
            <MemoryRouter>
                <Sidebar />
            </MemoryRouter>,
        );

        expect(container.querySelector('div[aria-hidden="true"]')).not.toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /expand sidebar/i }));

        const backdrop = container.querySelector('div[aria-hidden="true"]');
        expect(backdrop).toBeInTheDocument();

        await user.click(backdrop!);

        expect(screen.getByRole('button', { name: /expand sidebar/i })).toBeInTheDocument();
        expect(container.querySelector('div[aria-hidden="true"]')).not.toBeInTheDocument();
    });

    it('collapses the sidebar when a nav item is clicked', async () => {
        const user = userEvent.setup();
        render(
            <MemoryRouter>
                <Sidebar />
            </MemoryRouter>,
        );

        await user.click(screen.getByRole('button', { name: /expand sidebar/i }));
        expect(screen.getByRole('button', { name: /collapse sidebar/i })).toBeInTheDocument();

        await user.click(screen.getByRole('link', { name: /friends/i }));

        expect(screen.getByRole('button', { name: /expand sidebar/i })).toBeInTheDocument();
    });

    it('is hidden below md, where the bottom navigation takes over, and goes static at lg', () => {
        render(
            <MemoryRouter>
                <Sidebar />
            </MemoryRouter>,
        );

        const classTokens = screen.getByRole('complementary').className.split(/\s+/);
        expect(classTokens).toContain('hidden');
        expect(classTokens).toContain('md:flex');
        expect(classTokens).toContain('lg:static');
        expect(classTokens).toContain('lg:w-64');
    });

    it('keeps the collapse toggle out of the way once the sidebar is static at lg', () => {
        render(
            <MemoryRouter>
                <Sidebar />
            </MemoryRouter>,
        );

        expect(
            screen.getByRole('button', { name: /expand sidebar/i }).className.split(/\s+/),
        ).toContain('lg:hidden');
    });

    it('exposes its links as a labelled navigation landmark', () => {
        render(
            <MemoryRouter>
                <Sidebar />
            </MemoryRouter>,
        );

        expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument();
    });
});
