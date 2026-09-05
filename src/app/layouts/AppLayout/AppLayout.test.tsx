import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useCurrentUser } from '@app/hooks';
import { useAuthStore } from '@app/stores';
import { AppLayout } from './AppLayout';

vi.mock('@app/hooks', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@app/hooks')>()),
    useCurrentUser: vi.fn(() => ({
        data: { id: 'current-user', name: 'Alex Morgan', email: '', phone: '9876543210' },
    })),
}));

vi.mock('@features/groups', () => ({
    useGroup: () => ({ data: undefined }),
}));

vi.mock('@features/auth', () => ({
    ChangePasswordDialog: () => null,
}));

function renderLayout() {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });
    const router = createMemoryRouter([
        {
            path: '/',
            element: <AppLayout />,
            children: [{ index: true, element: <p>child route content</p> }],
        },
        { path: '/login', element: <p>login page</p> },
    ]);

    return render(
        <QueryClientProvider client={queryClient}>
            <RouterProvider router={router} />
        </QueryClientProvider>,
    );
}

describe('AppLayout', () => {
    beforeEach(() => {
        localStorage.clear();
        useAuthStore.setState({ currentUserId: null });
        // Restored explicitly: the phone-gate case below replaces this return
        // value, and vitest is not configured to reset mocks between tests.
        vi.mocked(useCurrentUser).mockReturnValue({
            data: { id: 'current-user', name: 'Alex Morgan', email: '', phone: '9876543210' },
        });
    });

    it('renders the matched child route through the outlet when logged in and has a phone number', () => {
        useAuthStore.setState({ currentUserId: 'current-user' });

        renderLayout();

        expect(screen.getByText('child route content')).toBeInTheDocument();
    });

    it.each([undefined, ''])('blocks the app when the logged-in user phone is %j', (phone) => {
        vi.mocked(useCurrentUser).mockReturnValue({
            data: { id: 'current-user', name: 'Alex Morgan', email: '', phone },
        });
        useAuthStore.setState({ currentUserId: 'current-user' });

        renderLayout();

        expect(screen.getByText('Add your phone number')).toBeInTheDocument();
        expect(screen.queryByText('child route content')).not.toBeInTheDocument();
    });

    it('keeps rendering the route while current-user data is loading', () => {
        vi.mocked(useCurrentUser).mockReturnValue({ data: undefined });
        useAuthStore.setState({ currentUserId: 'current-user' });

        renderLayout();

        expect(screen.getByText('child route content')).toBeInTheDocument();
    });

    it('redirects to the login page when not logged in', () => {
        renderLayout();

        expect(screen.getByText('login page')).toBeInTheDocument();
    });

    it('renders the sidebar and the mobile bottom navigation from one config', () => {
        useAuthStore.setState({ currentUserId: 'current-user' });

        const { container } = renderLayout();

        const navs = screen.getAllByRole('navigation', { name: 'Main' });
        expect(navs).toHaveLength(2);
        const [sidebarNav, bottomNav] = navs as [HTMLElement, HTMLElement];

        expect(container.querySelector('aside')).toContainElement(sidebarNav);
        expect(bottomNav.className.split(/\s+/)).toContain('md:hidden');
        expect(within(sidebarNav).getAllByRole('link')).toHaveLength(
            within(bottomNav).getAllByRole('link').length,
        );
    });

    it('hides the sidebar below md, where the bottom bar takes over', () => {
        useAuthStore.setState({ currentUserId: 'current-user' });

        const { container } = renderLayout();

        const asideTokens = container.querySelector('aside')?.className.split(/\s+/) ?? [];
        expect(asideTokens).toContain('hidden');
        expect(asideTokens).toContain('md:flex');
    });

    it('insets the content past the md rail and lets the lg sidebar claim its own width', () => {
        useAuthStore.setState({ currentUserId: 'current-user' });

        const { container } = renderLayout();

        const contentTokens =
            container.querySelector('main')?.parentElement?.className.split(/\s+/) ?? [];
        expect(contentTokens).toContain('md:pl-16');
        expect(contentTokens).toContain('lg:pl-0');
        expect(contentTokens).not.toContain('pl-16');
    });

    it('reserves room at the end of the scroll area for the fixed bottom navigation', () => {
        useAuthStore.setState({ currentUserId: 'current-user' });

        const { container } = renderLayout();

        const main = container.querySelector('main');
        // Shared with anything else pinned to the bottom of the viewport, so the
        // scroll area and the floating action button clear the bar by the same
        // amount.
        expect(main?.className.split(/\s+/)).toContain('pb-nav-clearance');
        expect(main?.className.split(/\s+/)).toContain('md:p-6');
    });
});
