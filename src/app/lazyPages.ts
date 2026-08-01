import { lazy } from 'react';

export const LoginPage = lazy(() =>
    import('@app/pages/LoginPage').then((module) => ({
        default: module.LoginPage,
    })),
);

export const FriendsPage = lazy(() =>
    import('@features/friends/pages/FriendsPage').then((module) => ({
        default: module.FriendsPage,
    })),
);

export const GroupsPage = lazy(() =>
    import('@features/groups/pages/GroupsPage').then((module) => ({
        default: module.GroupsPage,
    })),
);

export const GroupDetailPage = lazy(() =>
    import('@features/groups/pages/GroupDetailPage').then((module) => ({
        default: module.GroupDetailPage,
    })),
);

export const GroupSettingsPage = lazy(() =>
    import('@features/groups/pages/GroupSettingsPage').then((module) => ({
        default: module.GroupSettingsPage,
    })),
);

export const GroupBalancePage = lazy(() =>
    import('@features/balances/pages/GroupBalancePage').then((module) => ({
        default: module.GroupBalancePage,
    })),
);

export const ExpenseDetailPage = lazy(() =>
    import('@features/expenses/pages/ExpenseDetailPage').then((module) => ({
        default: module.ExpenseDetailPage,
    })),
);
