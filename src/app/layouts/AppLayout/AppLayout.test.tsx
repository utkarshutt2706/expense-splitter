import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useCurrentUser } from '@app/hooks';
import { useAuthStore } from '@app/stores';
import { AppLayout } from './AppLayout';

vi.mock('@app/hooks', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@app/hooks')>()),
    useCurrentUser: vi.fn(() => ({
        data: { id: 'current-user', name: 'Alex Morgan', email: '', phone: '9876543210' },
    })),
}));

vi.mock('@features/groups', () => ({
    useGroup: () => ({ data: undefined }),
}));

function renderLayout() {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });
    const router = createMemoryRouter([
        {
            path: '/',
            element: <AppLayout />,
            children: [{ index: true, element: <p>child route content</p> }],
        },
        { path: '/login', element: <p>login page</p> },
    ]);

    return render(
        <QueryClientProvider client={queryClient}>
            <RouterProvider router={router} />
        </QueryClientProvider>,
    );
}

describe('AppLayout', () => {
    beforeEach(() => {
        localStorage.clear();
        useAuthStore.setState({ currentUserId: null });
    });

    it('renders the matched child route through the outlet when logged in and has a phone number', () => {
        useAuthStore.setState({ currentUserId: 'current-user' });

        renderLayout();

        expect(screen.getByText('child route content')).toBeInTheDocument();
    });

    it('blocks the app until a logged-in user adds a phone number', () => {
        vi.mocked(useCurrentUser).mockReturnValue({
            data: { id: 'current-user', name: 'Alex Morgan', email: '', phone: undefined },
        });
        useAuthStore.setState({ currentUserId: 'current-user' });

        renderLayout();

        expect(screen.getByText('Add your phone number')).toBeInTheDocument();
        expect(screen.queryByText('child route content')).not.toBeInTheDocument();
    });

    it('redirects to the login page when not logged in', () => {
        renderLayout();

        expect(screen.getByText('login page')).toBeInTheDocument();
    });
});
