import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from 'sonner';
import { FriendsPage } from './FriendsPage';
import { useCreateFriend } from './useCreateFriend';
import { useFriends } from './useFriends';
import { useRemoveFriend } from './useRemoveFriend';
import { useUpdateFriend } from './useUpdateFriend';

vi.mock('./useFriends', () => ({
    useFriends: vi.fn(),
}));

vi.mock('./useCreateFriend', () => ({
    useCreateFriend: vi.fn(),
}));

vi.mock('./useUpdateFriend', () => ({
    useUpdateFriend: vi.fn(),
}));

vi.mock('./useRemoveFriend', () => ({
    useRemoveFriend: vi.fn(),
}));

vi.mock('sonner', () => ({
    toast: {
        loading: vi.fn(() => 'toast-id'),
        success: vi.fn(),
        error: vi.fn(),
    },
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

vi.mock('./EditFriendDialog', () => ({
    EditFriendDialog: ({
        open,
        onSubmit,
        onOpenChange,
    }: {
        open: boolean;
        onSubmit: (values: { name: string; email: string }) => void;
        onOpenChange: (open: boolean) => void;
    }) =>
        open ? (
            <div>
                <button
                    type="button"
                    onClick={() => onSubmit({ name: 'Priya S.', email: 'priya@example.com' })}
                >
                    Fake edit submit
                </button>
                <button type="button" onClick={() => onOpenChange(false)}>
                    Fake edit cancel
                </button>
            </div>
        ) : null,
}));

vi.mock('../../shared/ConfirmationDialog', () => ({
    ConfirmationDialog: ({
        open,
        onConfirm,
        onOpenChange,
    }: {
        open: boolean;
        onConfirm: () => void;
        onOpenChange: (open: boolean) => void;
    }) =>
        open ? (
            <div>
                <button type="button" onClick={onConfirm}>
                    Fake remove confirm
                </button>
                <button type="button" onClick={() => onOpenChange(false)}>
                    Fake remove cancel
                </button>
            </div>
        ) : null,
}));

vi.mock('./FriendRowMenu', () => ({
    FriendRowMenu: ({
        friendName,
        onEdit,
        onRemove,
    }: {
        friendName: string;
        onEdit: () => void;
        onRemove: () => void;
    }) => (
        <div>
            <button type="button" onClick={onEdit}>{`Fake edit ${friendName}`}</button>
            <button type="button" onClick={onRemove}>{`Fake remove ${friendName}`}</button>
        </div>
    ),
}));

const friends = [
    { id: 'friend-1', name: 'Priya Sharma', email: 'priya@example.com' },
    { id: 'friend-2', name: 'Jordan Lee', email: 'jordan@example.com' },
];

describe('FriendsPage', () => {
    beforeEach(() => {
        vi.mocked(useCreateFriend).mockReturnValue({
            mutate: vi.fn(),
        } as unknown as ReturnType<typeof useCreateFriend>);
        vi.mocked(useUpdateFriend).mockReturnValue({
            mutate: vi.fn(),
        } as unknown as ReturnType<typeof useUpdateFriend>);
        vi.mocked(useRemoveFriend).mockReturnValue({
            mutate: vi.fn(),
        } as unknown as ReturnType<typeof useRemoveFriend>);
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
            data: friends,
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

    describe('add toast behavior', () => {
        beforeEach(() => {
            vi.mocked(useFriends).mockReturnValue({
                data: [],
                isLoading: false,
                isError: false,
            } as unknown as ReturnType<typeof useFriends>);
        });

        it('shows a loading toast immediately, then updates it to success', () => {
            let onSuccess: (() => void) | undefined;
            vi.mocked(useCreateFriend).mockReturnValue({
                mutate: vi.fn((_values, options: { onSuccess?: () => void }) => {
                    onSuccess = options.onSuccess;
                }),
            } as unknown as ReturnType<typeof useCreateFriend>);

            render(<FriendsPage />);

            fireEvent.click(screen.getByRole('button', { name: /fake add friend dialog/i }));

            expect(toast.loading).toHaveBeenCalledWith('Friend is being added…');

            onSuccess?.();

            expect(toast.success).toHaveBeenCalledWith('Friend added', { id: 'toast-id' });
        });

        it('updates the loading toast to an error toast when the mutation fails', () => {
            let onError: (() => void) | undefined;
            vi.mocked(useCreateFriend).mockReturnValue({
                mutate: vi.fn((_values, options: { onError?: () => void }) => {
                    onError = options.onError;
                }),
            } as unknown as ReturnType<typeof useCreateFriend>);

            render(<FriendsPage />);

            fireEvent.click(screen.getByRole('button', { name: /fake add friend dialog/i }));
            onError?.();

            expect(toast.error).toHaveBeenCalledWith("Couldn't add friend", { id: 'toast-id' });
        });
    });

    describe('edit flow', () => {
        beforeEach(() => {
            vi.mocked(useFriends).mockReturnValue({
                data: friends,
                isLoading: false,
                isError: false,
            } as unknown as ReturnType<typeof useFriends>);
        });

        it('opens the edit dialog for the selected friend', () => {
            render(<FriendsPage />);

            expect(screen.queryByText(/fake edit submit/i)).not.toBeInTheDocument();

            fireEvent.click(screen.getByRole('button', { name: /fake edit priya sharma/i }));

            expect(screen.getByText(/fake edit submit/i)).toBeInTheDocument();
        });

        it('closes the edit dialog on cancel', () => {
            render(<FriendsPage />);

            fireEvent.click(screen.getByRole('button', { name: /fake edit priya sharma/i }));
            fireEvent.click(screen.getByRole('button', { name: /fake edit cancel/i }));

            expect(screen.queryByText(/fake edit submit/i)).not.toBeInTheDocument();
        });

        it('shows a loading toast immediately, then updates it to success', () => {
            let onSuccess: (() => void) | undefined;
            vi.mocked(useUpdateFriend).mockReturnValue({
                mutate: vi.fn((_values, options: { onSuccess?: () => void }) => {
                    onSuccess = options.onSuccess;
                }),
            } as unknown as ReturnType<typeof useUpdateFriend>);

            render(<FriendsPage />);

            fireEvent.click(screen.getByRole('button', { name: /fake edit priya sharma/i }));
            fireEvent.click(screen.getByRole('button', { name: /fake edit submit/i }));

            expect(toast.loading).toHaveBeenCalledWith('Friend is being updated…');

            onSuccess?.();

            expect(toast.success).toHaveBeenCalledWith('Friend updated', { id: 'toast-id' });
        });

        it('updates the loading toast to an error toast when the mutation fails', () => {
            let onError: (() => void) | undefined;
            vi.mocked(useUpdateFriend).mockReturnValue({
                mutate: vi.fn((_values, options: { onError?: () => void }) => {
                    onError = options.onError;
                }),
            } as unknown as ReturnType<typeof useUpdateFriend>);

            render(<FriendsPage />);

            fireEvent.click(screen.getByRole('button', { name: /fake edit priya sharma/i }));
            fireEvent.click(screen.getByRole('button', { name: /fake edit submit/i }));
            onError?.();

            expect(toast.error).toHaveBeenCalledWith("Couldn't update friend", { id: 'toast-id' });
        });
    });

    describe('remove flow', () => {
        beforeEach(() => {
            vi.mocked(useFriends).mockReturnValue({
                data: friends,
                isLoading: false,
                isError: false,
            } as unknown as ReturnType<typeof useFriends>);
        });

        it('opens the remove confirmation for the selected friend', () => {
            render(<FriendsPage />);

            expect(screen.queryByText(/fake remove confirm/i)).not.toBeInTheDocument();

            fireEvent.click(screen.getByRole('button', { name: /fake remove priya sharma/i }));

            expect(screen.getByText(/fake remove confirm/i)).toBeInTheDocument();
        });

        it('closes the confirmation on cancel without removing', () => {
            const mutate = vi.fn();
            vi.mocked(useRemoveFriend).mockReturnValue({
                mutate,
            } as unknown as ReturnType<typeof useRemoveFriend>);

            render(<FriendsPage />);

            fireEvent.click(screen.getByRole('button', { name: /fake remove priya sharma/i }));
            fireEvent.click(screen.getByRole('button', { name: /fake remove cancel/i }));

            expect(screen.queryByText(/fake remove confirm/i)).not.toBeInTheDocument();
            expect(mutate).not.toHaveBeenCalled();
        });

        it('shows a loading toast immediately, then updates it to success', () => {
            let onSuccess: (() => void) | undefined;
            vi.mocked(useRemoveFriend).mockReturnValue({
                mutate: vi.fn((_id, options: { onSuccess?: () => void }) => {
                    onSuccess = options.onSuccess;
                }),
            } as unknown as ReturnType<typeof useRemoveFriend>);

            render(<FriendsPage />);

            fireEvent.click(screen.getByRole('button', { name: /fake remove priya sharma/i }));
            fireEvent.click(screen.getByRole('button', { name: /fake remove confirm/i }));

            expect(toast.loading).toHaveBeenCalledWith('Friend is being removed…');

            onSuccess?.();

            expect(toast.success).toHaveBeenCalledWith('Friend removed', { id: 'toast-id' });
        });

        it('updates the loading toast to an error toast with the error message when blocked', () => {
            let onError: ((error: Error) => void) | undefined;
            vi.mocked(useRemoveFriend).mockReturnValue({
                mutate: vi.fn((_id, options: { onError?: (error: Error) => void }) => {
                    onError = options.onError;
                }),
            } as unknown as ReturnType<typeof useRemoveFriend>);

            render(<FriendsPage />);

            fireEvent.click(screen.getByRole('button', { name: /fake remove priya sharma/i }));
            fireEvent.click(screen.getByRole('button', { name: /fake remove confirm/i }));
            onError?.(new Error('This friend is part of a group and cannot be removed'));

            expect(toast.error).toHaveBeenCalledWith(
                'This friend is part of a group and cannot be removed',
                { id: 'toast-id' },
            );
        });
    });
});
