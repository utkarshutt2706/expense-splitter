import { createBrowserRouter } from 'react-router';
import { App } from './App';
import { PlaceholderPage } from './PlaceholderPage';

export const router = createBrowserRouter(
    [
        {
            path: '/',
            element: <App />,
            children: [
                { index: true, element: <PlaceholderPage title="Dashboard coming soon" /> },
                { path: 'friends', element: <PlaceholderPage title="Friends coming soon" /> },
                { path: 'groups', element: <PlaceholderPage title="Groups coming soon" /> },
                { path: 'activity', element: <PlaceholderPage title="Activity coming soon" /> },
                { path: 'settings', element: <PlaceholderPage title="Settings coming soon" /> },
            ],
        },
    ],
    { basename: import.meta.env.BASE_URL },
);
