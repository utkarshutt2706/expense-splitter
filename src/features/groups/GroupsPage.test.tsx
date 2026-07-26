import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from 'sonner';
import { GroupsPage } from './GroupsPage';
import { useCreateGroup } from './useCreateGroup';
import { useGroups } from './useGroups';
import { useUpdateGroup } from './useUpdateGroup';
import { useFriends } from '../friends/useFriends';

vi.mock('./useGroups', () => ({
    useGroups: vi.fn(),
}));

vi.mock('./useCreateGroup', () => ({
    useCreateGroup: vi.fn(),
}));

vi.mock('./useUpdateGroup', () => ({
    useUpdateGroup: vi.fn(),
}));

vi.mock('../friends/useFriends', () => ({
    useFriends: vi.fn(),
}));

vi.mock('sonner', () => ({
    toast: {
        loading: vi.fn(() => 'toast-id'),
        success: vi.fn(),
        error: vi.fn(),
    },
}));

vi.mock('./UpsertGroupDialog', () => ({
    UpsertGroupDialog: ({
        mode,
        open,
        onSubmit,
    }: {
        mode: 'add' | 'edit';
        open: boolean;
        onSubmit: (values: { name: string; memberIds: string[] }) => void;
    }) =>
        open ? (
            <button
                type="button"
                onClick={() => onSubmit({ name: 'Weekend Trip', memberIds: ['friend-1'] })}
            >
                {`Fake ${mode} group submit`}
            </button>
        ) : null,
}));

const groups = [
    {
        id: 'group-1',
        name: 'Weekend Trip',
        memberIds: ['current-user', 'friend-1', 'friend-2'],
        createdAt: '',
    },
    { id: 'group-2', name: 'Roommates', memberIds: ['current-user'], createdAt: '' },
];

describe('GroupsPage', () => {
    beforeEach(() => {
        vi.mocked(useFriends).mockReturnValue({
            data: [],
        } as unknown as ReturnType<typeof useFriends>);
        vi.mocked(useCreateGroup).mockReturnValue({
            mutate: vi.fn(),
        } as unknown as ReturnType<typeof useCreateGroup>);
        vi.mocked(useUpdateGroup).mockReturnValue({
            mutate: vi.fn(),
        } as unknown as ReturnType<typeof useUpdateGroup>);
    });

    it('shows a loading message while fetching', () => {
        vi.mocked(useGroups).mockReturnValue({
            data: undefined,
            isLoading: true,
            isError: false,
        } as unknown as ReturnType<typeof useGroups>);

        render(<GroupsPage />);

        expect(screen.getByText(/loading groups/i)).toBeInTheDocument();
    });

    it('shows an error message when the query fails', () => {
        vi.mocked(useGroups).mockReturnValue({
            data: undefined,
            isLoading: false,
            isError: true,
        } as unknown as ReturnType<typeof useGroups>);

        render(<GroupsPage />);

        expect(screen.getByText(/couldn't load groups/i)).toBeInTheDocument();
    });

    it('shows an empty state when there are no groups', () => {
        vi.mocked(useGroups).mockReturnValue({
            data: [],
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useGroups>);

        render(<GroupsPage />);

        expect(screen.getByText(/no groups yet/i)).toBeInTheDocument();
    });

    it('renders each group with its name and pluralized member count', () => {
        vi.mocked(useGroups).mockReturnValue({
            data: groups,
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useGroups>);

        render(<GroupsPage />);

        expect(screen.getByText('Weekend Trip')).toBeInTheDocument();
        expect(screen.getByText('3 members')).toBeInTheDocument();
        expect(screen.getByText('Roommates')).toBeInTheDocument();
        expect(screen.getByText('1 member')).toBeInTheDocument();
    });

    describe('create group flow', () => {
        beforeEach(() => {
            vi.mocked(useGroups).mockReturnValue({
                data: [],
                isLoading: false,
                isError: false,
            } as unknown as ReturnType<typeof useGroups>);
        });

        it('opens the create dialog when the trigger is clicked', () => {
            render(<GroupsPage />);

            expect(screen.queryByText(/fake add group submit/i)).not.toBeInTheDocument();

            fireEvent.click(screen.getByRole('button', { name: /create group/i }));

            expect(screen.getByText(/fake add group submit/i)).toBeInTheDocument();
        });

        it('shows a loading toast immediately, then updates it to success', () => {
            let onSuccess: (() => void) | undefined;
            vi.mocked(useCreateGroup).mockReturnValue({
                mutate: vi.fn((_values, options: { onSuccess?: () => void }) => {
                    onSuccess = options.onSuccess;
                }),
            } as unknown as ReturnType<typeof useCreateGroup>);

            render(<GroupsPage />);

            fireEvent.click(screen.getByRole('button', { name: /create group/i }));
            fireEvent.click(screen.getByText(/fake add group submit/i));

            expect(toast.loading).toHaveBeenCalledWith('Group is being created…');

            onSuccess?.();

            expect(toast.success).toHaveBeenCalledWith('Group created', { id: 'toast-id' });
        });

        it('updates the loading toast to an error toast with the error message when it fails', () => {
            let onError: ((error: Error) => void) | undefined;
            vi.mocked(useCreateGroup).mockReturnValue({
                mutate: vi.fn((_values, options: { onError?: (error: Error) => void }) => {
                    onError = options.onError;
                }),
            } as unknown as ReturnType<typeof useCreateGroup>);

            render(<GroupsPage />);

            fireEvent.click(screen.getByRole('button', { name: /create group/i }));
            fireEvent.click(screen.getByText(/fake add group submit/i));
            onError?.(new Error('Something went wrong'));

            expect(toast.error).toHaveBeenCalledWith('Something went wrong', { id: 'toast-id' });
        });
    });

    describe('edit group flow', () => {
        beforeEach(() => {
            vi.mocked(useGroups).mockReturnValue({
                data: groups,
                isLoading: false,
                isError: false,
            } as unknown as ReturnType<typeof useGroups>);
        });

        it('opens the edit dialog for the selected group', () => {
            render(<GroupsPage />);

            expect(screen.queryByText(/fake edit group submit/i)).not.toBeInTheDocument();

            fireEvent.click(screen.getByRole('button', { name: /edit weekend trip/i }));

            expect(screen.getByText(/fake edit group submit/i)).toBeInTheDocument();
        });

        it('shows a loading toast immediately, then updates it to success', () => {
            let onSuccess: (() => void) | undefined;
            vi.mocked(useUpdateGroup).mockReturnValue({
                mutate: vi.fn((_values, options: { onSuccess?: () => void }) => {
                    onSuccess = options.onSuccess;
                }),
            } as unknown as ReturnType<typeof useUpdateGroup>);

            render(<GroupsPage />);

            fireEvent.click(screen.getByRole('button', { name: /edit weekend trip/i }));
            fireEvent.click(screen.getByText(/fake edit group submit/i));

            expect(toast.loading).toHaveBeenCalledWith('Group is being updated…');

            onSuccess?.();

            expect(toast.success).toHaveBeenCalledWith('Group updated', { id: 'toast-id' });
        });

        it('updates the loading toast to an error toast with the error message when it fails', () => {
            let onError: ((error: Error) => void) | undefined;
            vi.mocked(useUpdateGroup).mockReturnValue({
                mutate: vi.fn((_values, options: { onError?: (error: Error) => void }) => {
                    onError = options.onError;
                }),
            } as unknown as ReturnType<typeof useUpdateGroup>);

            render(<GroupsPage />);

            fireEvent.click(screen.getByRole('button', { name: /edit weekend trip/i }));
            fireEvent.click(screen.getByText(/fake edit group submit/i));
            onError?.(new Error('Something went wrong'));

            expect(toast.error).toHaveBeenCalledWith('Something went wrong', { id: 'toast-id' });
        });
    });
});
