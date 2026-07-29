import { lazy } from 'react';

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

export const GroupBalancePage = lazy(() =>
    import('@features/balances/pages/GroupBalancePage').then((module) => ({
        default: module.GroupBalancePage,
    })),
);
