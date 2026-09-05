import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen } from '@testing-library/react';
import { Suspense, type ComponentType, type ReactElement } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '@app/stores';
import {
    AnalyticsPage,
    DashboardPage,
    ExpenseDetailPage,
    FriendsPage,
    GroupBalancePage,
    GroupDetailPage,
    GroupSettingsPage,
    GroupsPage,
    LoginPage,
    RegisterPage,
    UpsertExpensePage,
} from './lazyPages';
import { router, routes } from './router';

vi.mock('./hooks/useCurrentUser', () => ({
    useCurrentUser: () => ({
        data: { id: 'current-user', name: 'Alex Morgan', email: '', phone: '9876543210' },
    }),
}));

vi.mock('@features/groups', () => ({
    useGroup: () => ({ data: undefined }),
    useGroupSummaries: () => ({
        data: [],
        isLoading: false,
        isFetching: false,
        isError: false,
        refetch: vi.fn(),
    }),
    useCreateGroup: () => ({ mutate: vi.fn() }),
    CreateGroupDialog: () => null,
}));

vi.mock('@features/friends', () => ({
    useFriends: () => ({ data: [] }),
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

    async function renderRouterWithClient(routerInstance = router) {
        const queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false },
                mutations: { retry: false },
            },
        });

        await act(async () => {
            render(
                <QueryClientProvider client={queryClient}>
                    <RouterProvider router={routerInstance} />
                </QueryClientProvider>,
            );
        });
    }

    it('maps every authenticated URL to its intended page component', () => {
        const appRoute = routes.find(({ path }) => path === '/');
        const expected: Array<[string, ComponentType]> = [
            ['dashboard', DashboardPage],
            ['analytics', AnalyticsPage],
            ['friends', FriendsPage],
            ['groups', GroupsPage],
            ['groups/:groupId', GroupDetailPage],
            ['groups/:groupId/settings', GroupSettingsPage],
            ['groups/:groupId/balance', GroupBalancePage],
            ['groups/:groupId/expenses/new', UpsertExpensePage],
            ['groups/:groupId/expenses/:expenseId', ExpenseDetailPage],
            ['groups/:groupId/expenses/:expenseId/edit', UpsertExpensePage],
        ];

        for (const [path, component] of expected) {
            const route = appRoute?.children?.find((candidate) => candidate.path === path);
            expect((route?.element as ReactElement).type).toBe(component);
        }
    });

    it.each([
        ['login', LoginPage],
        ['register', RegisterPage],
    ] as const)('wraps the %s page in the shared loading boundary', (path, component) => {
        const route = routes.find((candidate) => candidate.path === path);
        const suspense = route?.element as ReactElement<{ children: ReactElement }>;

        expect(suspense.type).toBe(Suspense);
        expect(suspense.props.children.type).toBe(component);
        expect(route?.errorElement).toBeTruthy();
    });

    it('redirects to the login page at the root path when not logged in', async () => {
        await renderRouterWithClient();

        expect(await screen.findByLabelText(/email/i)).toBeInTheDocument();
    });

    it('redirects the root path to the group list when logged in', async () => {
        useAuthStore.setState({ currentUserId: 'current-user' });
        const memoryRouter = createMemoryRouter(routes, { initialEntries: ['/'] });

        await renderRouterWithClient(memoryRouter);

        expect(await screen.findByText(/no groups yet/i)).toBeInTheDocument();
        expect(memoryRouter.state.location.pathname).toBe('/groups');
    });

    it('replaces the root entry so back does not bounce through the redirect', async () => {
        useAuthStore.setState({ currentUserId: 'current-user' });
        const memoryRouter = createMemoryRouter(routes, { initialEntries: ['/'] });

        await renderRouterWithClient(memoryRouter);
        await screen.findByText(/no groups yet/i);

        expect(memoryRouter.state.historyAction).toBe('REPLACE');
    });

    it('renders the dashboard at its own path when logged in', async () => {
        useAuthStore.setState({ currentUserId: 'current-user' });
        const memoryRouter = createMemoryRouter(routes, { initialEntries: ['/dashboard'] });

        await renderRouterWithClient(memoryRouter);

        expect(await screen.findByText(/no shared spending yet/i)).toBeInTheDocument();
    });

    it('renders the not-found page for an unmatched route', async () => {
        const memoryRouter = createMemoryRouter(routes, { initialEntries: ['/does-not-exist'] });

        await renderRouterWithClient(memoryRouter);

        expect(await screen.findByRole('heading', { name: /page not found/i })).toBeInTheDocument();
    });
});
