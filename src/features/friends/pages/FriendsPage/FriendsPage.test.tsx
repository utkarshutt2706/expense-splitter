import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useFriends } from '@features/friends';
import { FriendsPage } from './FriendsPage';

vi.mock('@features/friends', () => ({
    useFriends: vi.fn(),
}));

const friends = [
    { id: 'friend-1', name: 'Priya Sharma', email: 'priya@example.com' },
    { id: 'friend-2', name: 'Jordan Lee', phone: '5551234567' },
];

describe('FriendsPage', () => {
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

        expect(screen.getByText(/couldn't load friends/i)).toBeInTheDocument();
    });

    it('shows an empty state explaining friends are derived from shared groups', () => {
        vi.mocked(useFriends).mockReturnValue({
            data: [],
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useFriends>);

        render(<FriendsPage />);

        expect(screen.getByText(/friends appear here once you share a group/i)).toBeInTheDocument();
    });

    it('hides the search box when there are no friends', () => {
        vi.mocked(useFriends).mockReturnValue({
            data: [],
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useFriends>);

        render(<FriendsPage />);

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

            expect(screen.getByText(/no friends match your search/i)).toBeInTheDocument();
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
