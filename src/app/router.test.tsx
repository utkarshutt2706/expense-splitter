import { render, screen } from '@testing-library/react';
import { RouterProvider } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '@app/stores';
import { router } from './router';

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
});
