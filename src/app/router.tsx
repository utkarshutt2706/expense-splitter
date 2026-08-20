import { Suspense } from 'react';
import { createBrowserRouter, Navigate, type RouteObject } from 'react-router';

import { AppLayout } from '@app/layouts';
import {
    DashboardPage,
    AnalyticsPage,
    ExpenseDetailPage,
    FriendsPage,
    GroupBalancePage,
    GroupDetailPage,
    GroupSettingsPage,
    GroupsPage,
    LoginPage,
    RegisterPage,
    UpsertExpensePage,
} from '@app/lazyPages';
import { ErrorPage } from '@app/pages/ErrorPage';
import { NotFoundPage } from '@app/pages/NotFoundPage';
import { PlaceholderPage } from '@app/pages/PlaceholderPage';
import { TopProgressBar } from '@shared/components';

// Exported separately from the router instance so tests can build their own
// createMemoryRouter around the same route tree (initialEntries/navigate
// against the real createBrowserRouter singleton is awkward to control).
export const routes: RouteObject[] = [
    {
        path: 'login',
        element: (
            <Suspense fallback={<TopProgressBar />}>
                <LoginPage />
            </Suspense>
        ),
        errorElement: <ErrorPage />,
    },
    {
        path: 'register',
        element: (
            <Suspense fallback={<TopProgressBar />}>
                <RegisterPage />
            </Suspense>
        ),
        errorElement: <ErrorPage />,
    },
    {
        path: '/',
        element: <AppLayout />,
        errorElement: <ErrorPage />,
        children: [
            // The group list is the daily-driver screen, so it owns the root
            // path. Redirecting rather than rendering GroupsPage here keeps a
            // single canonical URL for the list, which /groups/:groupId nests
            // under and which NavLink matches for the parent-active state.
            { index: true, element: <Navigate to="/groups" replace /> },
            { path: 'dashboard', element: <DashboardPage /> },
            { path: 'analytics', element: <AnalyticsPage /> },
            { path: 'friends', element: <FriendsPage /> },
            { path: 'groups', element: <GroupsPage /> },
            { path: 'groups/:groupId', element: <GroupDetailPage /> },
            { path: 'groups/:groupId/settings', element: <GroupSettingsPage /> },
            { path: 'groups/:groupId/balance', element: <GroupBalancePage /> },
            { path: 'groups/:groupId/expenses/new', element: <UpsertExpensePage /> },
            {
                path: 'groups/:groupId/expenses/:expenseId',
                element: <ExpenseDetailPage />,
            },
            {
                path: 'groups/:groupId/expenses/:expenseId/edit',
                element: <UpsertExpensePage />,
            },
            { path: 'activity', element: <PlaceholderPage title="Activity coming soon" /> },
            { path: 'settings', element: <PlaceholderPage title="Settings coming soon" /> },
        ],
    },
    { path: '*', element: <NotFoundPage /> },
];

export const router = createBrowserRouter(routes, { basename: import.meta.env.BASE_URL });
