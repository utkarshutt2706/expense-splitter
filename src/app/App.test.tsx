import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { App } from './App';

vi.mock('./useCurrentUser', () => ({
    useCurrentUser: () => ({ data: { id: 'current-user', name: 'Alex Morgan', email: '' } }),
}));

describe('App', () => {
    it('renders the matched child route through the outlet', () => {
        const router = createMemoryRouter([
            {
                path: '/',
                element: <App />,
                children: [{ index: true, element: <p>child route content</p> }],
            },
        ]);

        render(<RouterProvider router={router} />);

        expect(screen.getByText('child route content')).toBeInTheDocument();
    });
});
