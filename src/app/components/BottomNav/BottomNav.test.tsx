import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { navItems } from '@app/configs/navigation';
import { BottomNav } from './BottomNav';

function renderNav(initialPath = '/') {
    return render(
        <MemoryRouter initialEntries={[initialPath]}>
            <BottomNav />
        </MemoryRouter>,
    );
}

describe('BottomNav', () => {
    it('renders the same nav items as the desktop navigation', () => {
        renderNav();

        const nav = within(screen.getByRole('navigation', { name: 'Main' }));
        expect(nav.getByRole('link', { name: /dashboard/i })).toHaveAttribute('href', '/dashboard');
        expect(nav.getByRole('link', { name: /friends/i })).toHaveAttribute('href', '/friends');
        expect(nav.getByRole('link', { name: /groups/i })).toHaveAttribute('href', '/groups');
        expect(nav.getByRole('link', { name: /analytics/i })).toHaveAttribute('href', '/analytics');
        expect(nav.getByRole('link', { name: /activity/i })).toHaveAttribute('href', '/activity');
        expect(nav.getAllByRole('link')).toHaveLength(5);
        expect(nav.getAllByRole('link').map((link) => link.textContent)).toEqual(
            navItems.map(({ label }) => label),
        );
        expect(nav.getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual(
            navItems.map(({ to }) => to),
        );
    });

    it('stays pinned to the bottom of the viewport, above the home indicator', () => {
        renderNav();

        const classTokens = screen.getByRole('navigation', { name: 'Main' }).className.split(/\s+/);
        expect(classTokens).toContain('fixed');
        expect(classTokens).toContain('bottom-0');
        expect(classTokens).toContain('pb-[env(safe-area-inset-bottom,0px)]');
    });

    it('is hidden from the breakpoint where the top navigation takes over', () => {
        renderNav();

        expect(screen.getByRole('navigation', { name: 'Main' }).className.split(/\s+/)).toContain(
            'md:hidden',
        );
    });

    it('marks the matching route as active, including nested routes', () => {
        renderNav('/groups/group-1/settings');

        expect(screen.getByRole('link', { name: /groups/i })).toHaveAttribute(
            'aria-current',
            'page',
        );
        expect(screen.getByRole('link', { name: /dashboard/i })).not.toHaveAttribute(
            'aria-current',
        );
    });

    it('shows an indicator bar on the active item, so the state is not colour-only', () => {
        renderNav('/friends');

        const indicatorOf = (name: RegExp) =>
            screen.getByRole('link', { name }).querySelector('span[aria-hidden="true"]');

        expect(indicatorOf(/friends/i)?.className).toContain('opacity-100');
        expect(indicatorOf(/dashboard/i)?.className).toContain('opacity-0');
    });

    it('keeps a visible text label next to every icon', () => {
        renderNav();

        ['Dashboard', 'Friends', 'Groups', 'Analytics', 'Activity'].forEach((label) => {
            expect(screen.getByText(label)).toBeInTheDocument();
        });
    });
});
