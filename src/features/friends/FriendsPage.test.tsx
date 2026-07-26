import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FriendsPage } from './FriendsPage';
import { useCreateFriend } from './useCreateFriend';
import { useFriends } from './useFriends';

vi.mock('./useFriends', () => ({
    useFriends: vi.fn(),
}));

vi.mock('./useCreateFriend', () => ({
    useCreateFriend: vi.fn(),
}));

vi.mock('./AddFriendDialog', () => ({
    AddFriendDialog: ({
        onSubmit,
    }: {
        onSubmit: (values: { name: string; email: string }) => void;
    }) => (
        <button
            type="button"
            onClick={() => onSubmit({ name: 'Priya Sharma', email: 'priya@example.com' })}
        >
            Fake add friend dialog
        </button>
    ),
}));

describe('FriendsPage', () => {
    beforeEach(() => {
        vi.mocked(useCreateFriend).mockReturnValue({
            mutate: vi.fn(),
        } as unknown as ReturnType<typeof useCreateFriend>);
    });

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

    it('renders the add friend dialog trigger', () => {
        vi.mocked(useFriends).mockReturnValue({
            data: [],
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useFriends>);

        render(<FriendsPage />);

        expect(screen.getByRole('button', { name: /fake add friend dialog/i })).toBeInTheDocument();
    });

    describe('toast behavior', () => {
        beforeEach(() => {
            vi.useFakeTimers();
            vi.mocked(useFriends).mockReturnValue({
                data: [],
                isLoading: false,
                isError: false,
            } as unknown as ReturnType<typeof useFriends>);
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('shows a progress toast immediately, then a success toast that auto-dismisses', async () => {
            let onSuccess: (() => void) | undefined;
            vi.mocked(useCreateFriend).mockReturnValue({
                mutate: vi.fn((_values, options: { onSuccess?: () => void }) => {
                    onSuccess = options.onSuccess;
                }),
            } as unknown as ReturnType<typeof useCreateFriend>);

            render(<FriendsPage />);

            fireEvent.click(screen.getByRole('button', { name: /fake add friend dialog/i }));

            expect(screen.getByText(/friend is being added/i)).toBeInTheDocument();

            act(() => {
                onSuccess?.();
            });

            expect(screen.getByText(/^friend added$/i)).toBeInTheDocument();

            await act(async () => {
                await vi.advanceTimersByTimeAsync(2500);
            });

            expect(screen.queryByText(/friend added/i)).not.toBeInTheDocument();
        });

        it('shows an error toast that auto-dismisses when the mutation fails', async () => {
            let onError: (() => void) | undefined;
            vi.mocked(useCreateFriend).mockReturnValue({
                mutate: vi.fn((_values, options: { onError?: () => void }) => {
                    onError = options.onError;
                }),
            } as unknown as ReturnType<typeof useCreateFriend>);

            render(<FriendsPage />);

            fireEvent.click(screen.getByRole('button', { name: /fake add friend dialog/i }));
            act(() => {
                onError?.();
            });

            expect(screen.getByText(/couldn't add friend/i)).toBeInTheDocument();

            await act(async () => {
                await vi.advanceTimersByTimeAsync(2500);
            });

            expect(screen.queryByText(/couldn't add friend/i)).not.toBeInTheDocument();
        });
    });
});
