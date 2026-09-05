import { act, render, screen } from '@testing-library/react';
import { type ReactNode, Suspense } from 'react';
import { describe, expect, it, vi } from 'vitest';

import {
    ExpenseDetailPage,
    FriendsPage,
    GroupBalancePage,
    GroupDetailPage,
    GroupSettingsPage,
    GroupsPage,
    LoginPage,
    RegisterPage,
    AnalyticsPage,
    DashboardPage,
    UpsertExpensePage,
} from './lazyPages';

vi.mock('@features/auth/pages/LoginPage', () => ({
    LoginPage: () => <p>Login page</p>,
}));

vi.mock('@features/auth/pages/RegisterPage', () => ({
    RegisterPage: () => <p>Register page</p>,
}));

vi.mock('@features/dashboard/pages/DashboardPage', () => ({
    DashboardPage: () => <p>Dashboard page</p>,
}));

vi.mock('@features/analytics/pages/AnalyticsPage', () => ({
    AnalyticsPage: () => <p>Analytics page</p>,
}));

vi.mock('@features/friends/pages/FriendsPage', () => ({
    FriendsPage: () => <p>Friends page</p>,
}));

vi.mock('@features/groups/pages/GroupsPage', () => ({
    GroupsPage: () => <p>Groups page</p>,
}));

vi.mock('@features/groups/pages/GroupDetailPage', () => ({
    GroupDetailPage: () => <p>Group detail page</p>,
}));

vi.mock('@features/groups/pages/GroupSettingsPage', () => ({
    GroupSettingsPage: () => <p>Group settings page</p>,
}));

vi.mock('@features/balances/pages/GroupBalancePage', () => ({
    GroupBalancePage: () => <p>Group balance page</p>,
}));

vi.mock('@features/expenses/pages/ExpenseDetailPage', () => ({
    ExpenseDetailPage: () => <p>Expense detail page</p>,
}));

vi.mock('@features/expenses/pages/UpsertExpensePage', () => ({
    UpsertExpensePage: () => <p>Upsert expense page</p>,
}));

async function renderLazyPage(page: ReactNode, text: string) {
    await act(async () => {
        render(<Suspense fallback="loading">{page}</Suspense>);
    });

    expect(screen.getByText(text)).toBeInTheDocument();
}

describe('lazyPages', () => {
    it('resolves LoginPage to the real named export once loaded', async () => {
        await renderLazyPage(<LoginPage />, 'Login page');
    });

    it('resolves RegisterPage to the real named export once loaded', async () => {
        await renderLazyPage(<RegisterPage />, 'Register page');
    });

    it('resolves DashboardPage to the real named export once loaded', async () => {
        await renderLazyPage(<DashboardPage />, 'Dashboard page');
    });

    it('resolves AnalyticsPage to the real named export once loaded', async () => {
        await renderLazyPage(<AnalyticsPage />, 'Analytics page');
    });

    it('resolves FriendsPage to the real named export once loaded', async () => {
        await renderLazyPage(<FriendsPage />, 'Friends page');
    });

    it('resolves GroupsPage to the real named export once loaded', async () => {
        await renderLazyPage(<GroupsPage />, 'Groups page');
    });

    it('resolves GroupDetailPage to the real named export once loaded', async () => {
        await renderLazyPage(<GroupDetailPage />, 'Group detail page');
    });

    it('resolves GroupSettingsPage to the real named export once loaded', async () => {
        await renderLazyPage(<GroupSettingsPage />, 'Group settings page');
    });

    it('resolves GroupBalancePage to the real named export once loaded', async () => {
        await renderLazyPage(<GroupBalancePage />, 'Group balance page');
    });

    it('resolves ExpenseDetailPage to the real named export once loaded', async () => {
        await renderLazyPage(<ExpenseDetailPage />, 'Expense detail page');
    });

    it('resolves UpsertExpensePage to the real named export once loaded', async () => {
        await renderLazyPage(<UpsertExpensePage />, 'Upsert expense page');
    });
});
