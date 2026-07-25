import { createBrowserRouter } from 'react-router';
import { FriendsPage } from '../features/friends/FriendsPage';
import { AppLayout } from './layouts/AppLayout';
import { PlaceholderPage } from './pages/PlaceholderPage';

export const router = createBrowserRouter(
    [
        {
            path: '/',
            element: <AppLayout />,
            children: [
                { index: true, element: <PlaceholderPage title="Dashboard coming soon" /> },
                { path: 'friends', element: <FriendsPage /> },
                { path: 'groups', element: <PlaceholderPage title="Groups coming soon" /> },
                { path: 'activity', element: <PlaceholderPage title="Activity coming soon" /> },
                { path: 'settings', element: <PlaceholderPage title="Settings coming soon" /> },
            ],
        },
    ],
    { basename: import.meta.env.BASE_URL },
);
