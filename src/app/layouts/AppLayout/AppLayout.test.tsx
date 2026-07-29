import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '@app/stores';
import { AppLayout } from './AppLayout';

vi.mock('@app/hooks', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@app/hooks')>()),
    useCurrentUser: () => ({ data: { id: 'current-user', name: 'Alex Morgan', email: '' } }),
}));

vi.mock('@features/groups', () => ({
    useGroup: () => ({ data: undefined }),
}));

function renderLayout() {
    const router = createMemoryRouter([
        {
            path: '/',
            element: <AppLayout />,
            children: [{ index: true, element: <p>child route content</p> }],
        },
        { path: '/login', element: <p>login page</p> },
    ]);

    return render(<RouterProvider router={router} />);
}

describe('AppLayout', () => {
    beforeEach(() => {
        localStorage.clear();
        useAuthStore.setState({ currentUserId: null });
    });

    it('renders the matched child route through the outlet when logged in', () => {
        useAuthStore.setState({ currentUserId: 'current-user' });

        renderLayout();

        expect(screen.getByText('child route content')).toBeInTheDocument();
    });

    it('redirects to the login page when not logged in', () => {
        renderLayout();

        expect(screen.getByText('login page')).toBeInTheDocument();
    });
});
