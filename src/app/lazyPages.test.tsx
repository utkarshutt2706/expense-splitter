import { render, screen } from '@testing-library/react';
import { Suspense } from 'react';
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

vi.mock('@app/pages/LoginPage', () => ({
    LoginPage: () => <p>Login page</p>,
}));

vi.mock('@app/pages/RegisterPage', () => ({
    RegisterPage: () => <p>Register page</p>,
}));

vi.mock('@features/dashboard/pages/DashboardPage', () => ({
    DashboardPage: () => <p>Dashboard page</p>,
}));

vi.mock('@features/dashboard/pages/AnalyticsPage', () => ({
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

describe('lazyPages', () => {
    it('resolves LoginPage to the real named export once loaded', async () => {
        render(
            <Suspense fallback="loading">
                <LoginPage />
            </Suspense>,
        );

        expect(await screen.findByText('Login page')).toBeInTheDocument();
    });

    it('resolves RegisterPage to the real named export once loaded', async () => {
        render(
            <Suspense fallback="loading">
                <RegisterPage />
            </Suspense>,
        );

        expect(await screen.findByText('Register page')).toBeInTheDocument();
    });

    it('resolves DashboardPage to the real named export once loaded', async () => {
        render(
            <Suspense fallback="loading">
                <DashboardPage />
            </Suspense>,
        );

        expect(await screen.findByText('Dashboard page')).toBeInTheDocument();
    });

    it('resolves AnalyticsPage to the real named export once loaded', async () => {
        render(
            <Suspense fallback="loading">
                <AnalyticsPage />
            </Suspense>,
        );

        expect(await screen.findByText('Analytics page')).toBeInTheDocument();
    });

    it('resolves FriendsPage to the real named export once loaded', async () => {
        render(
            <Suspense fallback="loading">
                <FriendsPage />
            </Suspense>,
        );

        expect(await screen.findByText('Friends page')).toBeInTheDocument();
    });

    it('resolves GroupsPage to the real named export once loaded', async () => {
        render(
            <Suspense fallback="loading">
                <GroupsPage />
            </Suspense>,
        );

        expect(await screen.findByText('Groups page')).toBeInTheDocument();
    });

    it('resolves GroupDetailPage to the real named export once loaded', async () => {
        render(
            <Suspense fallback="loading">
                <GroupDetailPage />
            </Suspense>,
        );

        expect(await screen.findByText('Group detail page')).toBeInTheDocument();
    });

    it('resolves GroupSettingsPage to the real named export once loaded', async () => {
        render(
            <Suspense fallback="loading">
                <GroupSettingsPage />
            </Suspense>,
        );

        expect(await screen.findByText('Group settings page')).toBeInTheDocument();
    });

    it('resolves GroupBalancePage to the real named export once loaded', async () => {
        render(
            <Suspense fallback="loading">
                <GroupBalancePage />
            </Suspense>,
        );

        expect(await screen.findByText('Group balance page')).toBeInTheDocument();
    });

    it('resolves ExpenseDetailPage to the real named export once loaded', async () => {
        render(
            <Suspense fallback="loading">
                <ExpenseDetailPage />
            </Suspense>,
        );

        expect(await screen.findByText('Expense detail page')).toBeInTheDocument();
    });

    it('resolves UpsertExpensePage to the real named export once loaded', async () => {
        render(
            <Suspense fallback="loading">
                <UpsertExpensePage />
            </Suspense>,
        );

        expect(await screen.findByText('Upsert expense page')).toBeInTheDocument();
    });
});
