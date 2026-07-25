import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { Sidebar } from './Sidebar';

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
        expect(screen.getByRole('link', { name: /settings/i })).toHaveAttribute(
            'href',
            '/settings',
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
});
