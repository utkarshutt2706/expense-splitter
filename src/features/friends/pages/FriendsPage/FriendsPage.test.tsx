import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from 'sonner';

import { useFriends } from '@features/friends';
import { FriendsPage } from './FriendsPage';

vi.mock('@features/friends', () => ({
    useFriends: vi.fn(),
}));
vi.mock('sonner', () => ({
    toast: { success: vi.fn(), error: vi.fn() },
}));

const friends = [
    {
        id: 'friend-1',
        name: 'Priya Sharma',
        email: 'priya@example.com',
        sharedGroupCount: 1,
        netBalance: 1250,
        groupBalances: [
            { groupId: 'group-1', groupName: 'Weekend Trip', balance: 1500 },
            { groupId: 'group-2', groupName: 'Flatmates', balance: -250 },
        ],
    },
    {
        id: 'friend-2',
        name: 'Jordan Lee',
        phone: '5551234567',
        sharedGroupCount: 3,
        netBalance: -500,
        groupBalances: [{ groupId: 'group-3', groupName: 'Office Lunch', balance: -500 }],
    },
];

describe('FriendsPage', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: { writeText: vi.fn().mockResolvedValue(undefined) },
        });
    });

    it('does not introduce manual friendship controls', () => {
        vi.mocked(useFriends).mockReturnValue({
            data: friends,
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useFriends>);

        render(<FriendsPage />);

        expect(
            screen.queryByRole('button', { name: /add friend|remove friend/i }),
        ).not.toBeInTheDocument();
    });

    it('shows a loading message while fetching', () => {
        vi.mocked(useFriends).mockReturnValue({
            data: undefined,
            isLoading: true,
            isError: false,
        } as unknown as ReturnType<typeof useFriends>);

        render(<FriendsPage />);

        expect(screen.getByRole('status', { name: /loading friends/i })).toBeInTheDocument();
    });

    it('does not render the search box while fetching', () => {
        vi.mocked(useFriends).mockReturnValue({
            data: undefined,
            isLoading: true,
            isError: false,
        } as unknown as ReturnType<typeof useFriends>);

        render(<FriendsPage />);

        expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
    });

    it('shows an error message when the query fails', () => {
        vi.mocked(useFriends).mockReturnValue({
            data: undefined,
            isLoading: false,
            isError: true,
        } as unknown as ReturnType<typeof useFriends>);

        render(<FriendsPage />);

        expect(screen.getByText(/we couldn’t load your friends/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });

    it('shows an empty state explaining friends are derived from shared groups', () => {
        vi.mocked(useFriends).mockReturnValue({
            data: [],
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useFriends>);

        render(
            <MemoryRouter>
                <FriendsPage />
            </MemoryRouter>,
        );

        expect(
            screen.getByText(/people you share a group with will appear here automatically/i),
        ).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /create group/i })).toHaveAttribute(
            'href',
            '/groups',
        );
    });

    it("prefixes the empty state's create-group link with the router basename", () => {
        vi.mocked(useFriends).mockReturnValue({
            data: [],
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useFriends>);

        // The production build is served from a sub-path (see vite base and the
        // router's basename), so this link has to go through the router — a bare
        // <a href="/groups"> resolves against the origin root and 404s there.
        render(
            <MemoryRouter
                basename="/expense-splitter"
                initialEntries={['/expense-splitter/friends']}
            >
                <FriendsPage />
            </MemoryRouter>,
        );

        expect(screen.getByRole('link', { name: /create group/i })).toHaveAttribute(
            'href',
            '/expense-splitter/groups',
        );
    });

    it('hides the search box when there are no friends', () => {
        vi.mocked(useFriends).mockReturnValue({
            data: [],
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useFriends>);

        render(
            <MemoryRouter>
                <FriendsPage />
            </MemoryRouter>,
        );

        expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
    });

    it('shows a refreshing indicator during a background refetch, not the loading skeleton', () => {
        vi.mocked(useFriends).mockReturnValue({
            data: friends,
            isLoading: false,
            isFetching: true,
            isError: false,
        } as unknown as ReturnType<typeof useFriends>);

        render(<FriendsPage />);

        expect(screen.getByRole('status', { name: 'Refreshing…' })).toBeInTheDocument();
        expect(screen.queryByRole('status', { name: /loading friends/i })).not.toBeInTheDocument();
    });

    it('does not show a refreshing indicator once the background refetch settles', () => {
        vi.mocked(useFriends).mockReturnValue({
            data: friends,
            isLoading: false,
            isFetching: false,
            isError: false,
        } as unknown as ReturnType<typeof useFriends>);

        render(<FriendsPage />);

        expect(screen.queryByRole('status', { name: 'Refreshing…' })).not.toBeInTheDocument();
    });

    it('renders each friend with their name and contact info', () => {
        vi.mocked(useFriends).mockReturnValue({
            data: friends,
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useFriends>);

        render(<FriendsPage />);

        expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
        expect(screen.getByText('priya@example.com')).toBeInTheDocument();
        expect(screen.getByText('Jordan Lee')).toBeInTheDocument();
        expect(screen.getByText('5551234567')).toBeInTheDocument();
        expect(screen.getByText('1 shared group')).toBeInTheDocument();
        expect(screen.getByText('3 shared groups')).toBeInTheDocument();
        expect(screen.getByText(/owes you ₹1,250\.00/i)).toBeInTheDocument();
        expect(screen.getByText(/you owe ₹500\.00/i)).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: /email priya sharma.*copy email/i }),
        ).toBeVisible();
        expect(screen.getByRole('button', { name: /call jordan lee.*copy phone/i })).toBeVisible();
    });

    it('copies contact details directly on non-mobile devices', async () => {
        const user = userEvent.setup();
        const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
        vi.mocked(useFriends).mockReturnValue({
            data: friends,
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useFriends>);

        render(<FriendsPage />);

        await user.click(screen.getByRole('button', { name: /email priya sharma.*copy email/i }));

        expect(writeText).toHaveBeenCalledWith('priya@example.com');
        expect(toast.success).toHaveBeenCalledWith('Email address copied to clipboard.');
    });

    it('offers copy and native actions on mobile devices', async () => {
        const user = userEvent.setup();
        const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
        vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(
            'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Mobile',
        );
        vi.mocked(useFriends).mockReturnValue({
            data: friends,
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useFriends>);

        render(<FriendsPage />);

        await user.click(
            screen.getByRole('button', { name: /call jordan lee.*choose an action/i }),
        );

        expect(screen.getByRole('link', { name: /call phone/i })).toHaveAttribute(
            'href',
            'tel:5551234567',
        );
        await user.click(screen.getByRole('button', { name: /copy phone/i }));
        expect(writeText).toHaveBeenCalledWith('5551234567');
        expect(toast.success).toHaveBeenCalledWith('Phone number copied to clipboard.');
    });

    it('renders friends as individual cards', () => {
        vi.mocked(useFriends).mockReturnValue({
            data: friends,
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useFriends>);

        render(<FriendsPage />);

        const priyaCard = screen.getByText('Priya Sharma').closest('li');
        const jordanCard = screen.getByText('Jordan Lee').closest('li');

        expect(priyaCard).toHaveClass('rounded-xl', 'border');
        expect(jordanCard).toHaveClass('rounded-xl', 'border');
        expect(priyaCard?.parentElement).toHaveClass('space-y-3');
        expect(priyaCard).toHaveClass('p-3', 'sm:p-4');

        const contactDetails = screen.getByText('priya@example.com').parentElement?.parentElement;
        expect(contactDetails).toHaveClass('flex-wrap');
        expect(contactDetails).not.toHaveClass('flex-col');
    });

    it('reveals per-group balances and links each group to its detail page', async () => {
        const user = userEvent.setup();
        vi.mocked(useFriends).mockReturnValue({
            data: friends,
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useFriends>);

        render(
            <MemoryRouter>
                <FriendsPage />
            </MemoryRouter>,
        );

        await user.click(
            screen.getByRole('button', { name: /view balance breakdown with priya sharma/i }),
        );

        const breakdown = screen.getByRole('dialog', { name: /balance breakdown with priya/i });
        expect(breakdown).toBeVisible();
        expect(breakdown).toHaveAttribute('data-align', 'start');
        expect(breakdown).toHaveClass('max-w-[calc(100vw-6rem)]');
        expect(screen.getByRole('link', { name: /weekend trip/i })).toHaveAttribute(
            'href',
            '/groups/group-1',
        );
        expect(screen.getByRole('link', { name: /flatmates/i })).toHaveAttribute(
            'href',
            '/groups/group-2',
        );
        expect(screen.getByText(/owes you ₹1,500\.00/i)).toBeInTheDocument();
        expect(screen.getByText(/you owe ₹250\.00/i)).toBeInTheDocument();
    });

    describe('search', () => {
        beforeEach(() => {
            vi.mocked(useFriends).mockReturnValue({
                data: friends,
                isLoading: false,
                isError: false,
            } as unknown as ReturnType<typeof useFriends>);
        });

        it('filters friends by name', () => {
            render(<FriendsPage />);

            fireEvent.change(screen.getByRole('searchbox', { name: /search friends/i }), {
                target: { value: 'priya' },
            });

            expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
            expect(screen.queryByText('Jordan Lee')).not.toBeInTheDocument();
        });

        it('filters friends by email', () => {
            render(<FriendsPage />);

            fireEvent.change(screen.getByRole('searchbox', { name: /search friends/i }), {
                target: { value: 'priya@example.com' },
            });

            expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
            expect(screen.queryByText('Jordan Lee')).not.toBeInTheDocument();
        });

        it('filters friends by phone number', () => {
            render(<FriendsPage />);

            fireEvent.change(screen.getByRole('searchbox', { name: /search friends/i }), {
                target: { value: '5551234567' },
            });

            expect(screen.getByText('Jordan Lee')).toBeInTheDocument();
            expect(screen.queryByText('Priya Sharma')).not.toBeInTheDocument();
        });

        it('normalizes punctuation and whitespace when searching phone numbers', () => {
            vi.mocked(useFriends).mockReturnValue({
                data: [{ ...friends[1], phone: '(555) 123-4567' }],
                isLoading: false,
                isError: false,
            } as unknown as ReturnType<typeof useFriends>);
            render(<FriendsPage />);

            fireEvent.change(screen.getByRole('searchbox', { name: /search friends/i }), {
                target: { value: '555 123 4567' },
            });

            expect(screen.getByText('Jordan Lee')).toBeInTheDocument();
        });

        it('is case-insensitive', () => {
            render(<FriendsPage />);

            fireEvent.change(screen.getByRole('searchbox', { name: /search friends/i }), {
                target: { value: 'PRIYA' },
            });

            expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
        });

        it('shows a no-match message when nothing matches the search', () => {
            render(<FriendsPage />);

            fireEvent.change(screen.getByRole('searchbox', { name: /search friends/i }), {
                target: { value: 'nobody' },
            });

            expect(screen.getByText(/no friends found/i)).toBeInTheDocument();
            expect(
                screen.getByText(/try a different name, email, or phone number/i),
            ).toBeInTheDocument();
            expect(screen.queryByText('Priya Sharma')).not.toBeInTheDocument();
            expect(screen.queryByText('Jordan Lee')).not.toBeInTheDocument();
        });

        it('shows every friend again once the search is cleared', () => {
            render(<FriendsPage />);

            const searchBox = screen.getByRole('searchbox', { name: /search friends/i });
            fireEvent.change(searchBox, { target: { value: 'priya' } });
            fireEvent.change(searchBox, { target: { value: '' } });

            expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
            expect(screen.getByText('Jordan Lee')).toBeInTheDocument();
        });
    });
});
