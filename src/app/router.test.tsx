import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '@app/stores';
import { router, routes } from './router';

vi.mock('./hooks/useCurrentUser', () => ({
    useCurrentUser: () => ({
        data: { id: 'current-user', name: 'Alex Morgan', email: '', phone: '9876543210' },
    }),
}));

vi.mock('@features/groups', () => ({
    useGroup: () => ({ data: undefined }),
}));

vi.mock('@features/dashboard/hooks', () => ({
    useDashboard: () => ({
        data: { actualPaid: 0, currentUserShare: 0, groupSpend: [] },
        isLoading: false,
        isError: false,
    }),
}));

vi.mock('@features/auth', () => ({
    useLogin: () => ({ mutateAsync: vi.fn() }),
    useRegister: () => ({ mutateAsync: vi.fn() }),
}));

describe('router', () => {
    beforeEach(() => {
        localStorage.clear();
        useAuthStore.setState({ currentUserId: null });
    });

    function renderRouterWithClient(routerInstance = router) {
        const queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false },
                mutations: { retry: false },
            },
        });

        return render(
            <QueryClientProvider client={queryClient}>
                <RouterProvider router={routerInstance} />
            </QueryClientProvider>,
        );
    }

    it('redirects to the login page at the root path when not logged in', async () => {
        renderRouterWithClient();

        expect(await screen.findByLabelText(/email/i)).toBeInTheDocument();
    });

    it('renders the dashboard at the root path when logged in', async () => {
        useAuthStore.setState({ currentUserId: 'current-user' });

        renderRouterWithClient();

        expect(await screen.findByText(/no shared spending yet/i)).toBeInTheDocument();
    });

    it('renders the not-found page for an unmatched route', async () => {
        const memoryRouter = createMemoryRouter(routes, { initialEntries: ['/does-not-exist'] });

        renderRouterWithClient(memoryRouter);

        expect(await screen.findByRole('heading', { name: /page not found/i })).toBeInTheDocument();
    });
});
