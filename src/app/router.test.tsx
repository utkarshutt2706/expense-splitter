import { render, screen } from '@testing-library/react';
import { RouterProvider } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { router } from './router';

vi.mock('./hooks/useCurrentUser', () => ({
    useCurrentUser: () => ({ data: { id: 'current-user', name: 'Alex Morgan', email: '' } }),
}));

vi.mock('@features/groups', () => ({
    useGroup: () => ({ data: undefined }),
}));

describe('router', () => {
    it('renders the dashboard at the root path', () => {
        render(<RouterProvider router={router} />);

        expect(screen.getByText(/dashboard coming soon/i)).toBeInTheDocument();
    });
});
