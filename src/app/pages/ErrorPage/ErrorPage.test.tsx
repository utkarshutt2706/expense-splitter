import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

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

function renderRouteResponse(status: number) {
    const router = createMemoryRouter([
        {
            path: '/',
            loader: () => {
                throw new Response('route failure', { status });
            },
            element: <p>home</p>,
            errorElement: <ErrorPage />,
        },
        { path: '/groups', element: <p>groups page</p> },
    ]);
    render(<RouterProvider router={router} />);
    return router;
}

describe('ErrorPage', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

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
    });

    it('shows the not-found state for an explicit 404 response', async () => {
        renderRouteResponse(404);

        expect(await screen.findByRole('heading', { name: /page not found/i })).toBeInTheDocument();
        expect(screen.getByText(/doesn't exist or may have moved/i)).toBeInTheDocument();
        expect(screen.queryByText('route failure')).not.toBeInTheDocument();
    });

    it('shows a generic state without leaking details for a non-404 route response', async () => {
        renderRouteResponse(503);

        expect(
            await screen.findByRole('heading', { name: /something went wrong/i }),
        ).toBeInTheDocument();
        expect(screen.getByText(/unexpected error occurred/i)).toBeInTheDocument();
        expect(screen.queryByText('route failure')).not.toBeInTheDocument();
    });

    it('shows a generic state without assuming an unknown thrown value has a message', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});

        renderThrown('unknown failure');

        expect(
            await screen.findByRole('heading', { name: /something went wrong/i }),
        ).toBeInTheDocument();
        expect(screen.queryByText('unknown failure')).not.toBeInTheDocument();
    });

    it('does not show the error message for a "not found" state', async () => {
        const router = createMemoryRouter(
            [{ path: '/', element: <p>home</p>, errorElement: <ErrorPage /> }],
            { initialEntries: ['/does-not-exist'] },
        );

        render(<RouterProvider router={router} />);
        await screen.findByRole('heading', { name: /page not found/i });

        expect(screen.getByRole('link', { name: /back to groups/i })).toHaveAttribute(
            'href',
            '/groups',
        );
    });

    it('navigates back to the groups page', async () => {
        const user = userEvent.setup();
        const router = renderRouteResponse(503);

        await user.click(await screen.findByRole('link', { name: /back to groups/i }));

        expect(await screen.findByText('groups page')).toBeInTheDocument();
        expect(router.state.location.pathname).toBe('/groups');
    });
});
