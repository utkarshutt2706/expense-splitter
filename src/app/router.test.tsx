import { render, screen } from '@testing-library/react';
import { RouterProvider } from 'react-router';
import { describe, expect, it } from 'vitest';
import { router } from './router';

describe('router', () => {
    it('renders the dashboard at the root path', () => {
        render(<RouterProvider router={router} />);

        expect(screen.getByText(/dashboard coming soon/i)).toBeInTheDocument();
    });
});
