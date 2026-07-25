import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FriendsPage } from './FriendsPage';
import { useFriends } from './useFriends';

vi.mock('./useFriends', () => ({
    useFriends: vi.fn(),
}));

describe('FriendsPage', () => {
    it('shows a loading message while fetching', () => {
        vi.mocked(useFriends).mockReturnValue({
            data: undefined,
            isLoading: true,
            isError: false,
        } as unknown as ReturnType<typeof useFriends>);

        render(<FriendsPage />);

        expect(screen.getByText(/loading friends/i)).toBeInTheDocument();
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

    it('shows an empty state when there are no friends', () => {
        vi.mocked(useFriends).mockReturnValue({
            data: [],
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useFriends>);

        render(<FriendsPage />);

        expect(screen.getByText(/no friends yet/i)).toBeInTheDocument();
    });

    it('renders each friend with their name and email', () => {
        vi.mocked(useFriends).mockReturnValue({
            data: [
                { id: 'friend-1', name: 'Priya Sharma', email: 'priya@example.com' },
                { id: 'friend-2', name: 'Jordan Lee', email: 'jordan@example.com' },
            ],
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useFriends>);

        render(<FriendsPage />);

        expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
        expect(screen.getByText('priya@example.com')).toBeInTheDocument();
        expect(screen.getByText('Jordan Lee')).toBeInTheDocument();
        expect(screen.getByText('jordan@example.com')).toBeInTheDocument();
    });
});
