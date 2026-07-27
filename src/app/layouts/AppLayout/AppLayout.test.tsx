import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { AppLayout } from './AppLayout';

vi.mock('@app/hooks', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@app/hooks')>()),
    useCurrentUser: () => ({ data: { id: 'current-user', name: 'Alex Morgan', email: '' } }),
}));

vi.mock('@features/groups', () => ({
    useGroup: () => ({ data: undefined }),
}));

describe('AppLayout', () => {
    it('renders the matched child route through the outlet', () => {
        const router = createMemoryRouter([
            {
                path: '/',
                element: <AppLayout />,
                children: [{ index: true, element: <p>child route content</p> }],
            },
        ]);

        render(<RouterProvider router={router} />);

        expect(screen.getByText('child route content')).toBeInTheDocument();
    });
});
