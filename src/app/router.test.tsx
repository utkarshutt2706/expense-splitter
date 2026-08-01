import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '@app/stores';
import { router, routes } from './router';

vi.mock('./hooks/useCurrentUser', () => ({
    useCurrentUser: () => ({ data: { id: 'current-user', name: 'Alex Morgan', email: '' } }),
}));

vi.mock('@features/groups', () => ({
    useGroup: () => ({ data: undefined }),
}));

describe('router', () => {
    beforeEach(() => {
        localStorage.clear();
        useAuthStore.setState({ currentUserId: null });
    });

    it('redirects to the login page at the root path when not logged in', async () => {
        render(<RouterProvider router={router} />);

        expect(await screen.findByLabelText(/username/i)).toBeInTheDocument();
    });

    it('renders the dashboard at the root path when logged in', () => {
        useAuthStore.setState({ currentUserId: 'current-user' });

        render(<RouterProvider router={router} />);

        expect(screen.getByText(/dashboard coming soon/i)).toBeInTheDocument();
    });

    it('renders the not-found page for an unmatched route', async () => {
        const memoryRouter = createMemoryRouter(routes, { initialEntries: ['/does-not-exist'] });

        render(<RouterProvider router={memoryRouter} />);

        expect(await screen.findByRole('heading', { name: /page not found/i })).toBeInTheDocument();
    });
});
