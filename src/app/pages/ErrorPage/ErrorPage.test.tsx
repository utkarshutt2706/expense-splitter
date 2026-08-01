import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { ErrorPage } from './ErrorPage';

function ThrowingComponent({ error }: { error: unknown }): never {
    throw error;
}

function renderThrown(error: unknown) {
    const router = createMemoryRouter([
        {
            path: '/',
            element: <ThrowingComponent error={error} />,
            errorElement: <ErrorPage />,
        },
    ]);
    return render(<RouterProvider router={router} />);
}

describe('ErrorPage', () => {
    it('shows a "not found" state for a thrown 404 route-error response', async () => {
        const router = createMemoryRouter(
            [{ path: '/', element: <p>home</p>, errorElement: <ErrorPage /> }],
            { initialEntries: ['/does-not-exist'] },
        );

        render(<RouterProvider router={router} />);

        expect(await screen.findByRole('heading', { name: /page not found/i })).toBeInTheDocument();
    });

    it('shows a generic error state and the message for a thrown error', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});

        renderThrown(new Error('Something exploded'));

        expect(
            await screen.findByRole('heading', { name: /something went wrong/i }),
        ).toBeInTheDocument();
        expect(screen.getByText('Something exploded')).toBeInTheDocument();

        vi.restoreAllMocks();
    });

    it('does not show the error message for a "not found" state', async () => {
        const router = createMemoryRouter(
            [{ path: '/', element: <p>home</p>, errorElement: <ErrorPage /> }],
            { initialEntries: ['/does-not-exist'] },
        );

        render(<RouterProvider router={router} />);
        await screen.findByRole('heading', { name: /page not found/i });

        expect(screen.getByRole('link', { name: /back to dashboard/i })).toHaveAttribute(
            'href',
            '/',
        );
    });
});
