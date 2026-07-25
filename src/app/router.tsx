import { createBrowserRouter } from 'react-router';
import { App } from './App';
import { Dashboard } from './Dashboard';

export const router = createBrowserRouter(
    [
        {
            path: '/',
            element: <App />,
            children: [{ index: true, element: <Dashboard /> }],
        },
    ],
    { basename: import.meta.env.BASE_URL },
);
