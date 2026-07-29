import { render, screen } from '@testing-library/react';
import { Suspense } from 'react';
import { describe, expect, it, vi } from 'vitest';

import {
    ExpenseDetailPage,
    FriendsPage,
    GroupBalancePage,
    GroupDetailPage,
    GroupsPage,
} from './lazyPages';

vi.mock('@features/friends/pages/FriendsPage', () => ({
    FriendsPage: () => <p>Friends page</p>,
}));

vi.mock('@features/groups/pages/GroupsPage', () => ({
    GroupsPage: () => <p>Groups page</p>,
}));

vi.mock('@features/groups/pages/GroupDetailPage', () => ({
    GroupDetailPage: () => <p>Group detail page</p>,
}));

vi.mock('@features/balances/pages/GroupBalancePage', () => ({
    GroupBalancePage: () => <p>Group balance page</p>,
}));

vi.mock('@features/expenses/pages/ExpenseDetailPage', () => ({
    ExpenseDetailPage: () => <p>Expense detail page</p>,
}));

describe('lazyPages', () => {
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
});
