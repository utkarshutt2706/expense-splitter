import { createBrowserRouter } from 'react-router';

import { AppLayout } from '@app/layouts';
import { FriendsPage, GroupDetailPage, GroupsPage } from '@app/lazyPages';
import { PlaceholderPage } from '@app/pages/PlaceholderPage';

export const router = createBrowserRouter(
    [
        {
            path: '/',
            element: <AppLayout />,
            children: [
                { index: true, element: <PlaceholderPage title="Dashboard coming soon" /> },
                { path: 'friends', element: <FriendsPage /> },
                { path: 'groups', element: <GroupsPage /> },
                { path: 'groups/:groupId', element: <GroupDetailPage /> },
                { path: 'activity', element: <PlaceholderPage title="Activity coming soon" /> },
                { path: 'settings', element: <PlaceholderPage title="Settings coming soon" /> },
            ],
        },
    ],
    { basename: import.meta.env.BASE_URL },
);
