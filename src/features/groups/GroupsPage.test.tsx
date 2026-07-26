import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from 'sonner';
import { GroupsPage } from './GroupsPage';
import { useCreateGroup } from './useCreateGroup';
import { useGroups } from './useGroups';
import { useFriends } from '../friends/useFriends';

vi.mock('./useGroups', () => ({
    useGroups: vi.fn(),
}));

vi.mock('./useCreateGroup', () => ({
    useCreateGroup: vi.fn(),
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

vi.mock('./CreateGroupDialog', () => ({
    CreateGroupDialog: ({
        open,
        onSubmit,
    }: {
        open: boolean;
        onSubmit: (values: { name: string; memberIds: string[] }) => void;
    }) =>
        open ? (
            <button
                type="button"
                onClick={() => onSubmit({ name: 'Weekend Trip', memberIds: ['friend-1'] })}
            >
                Fake create group submit
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

function renderPage() {
    return render(
        <MemoryRouter>
            <GroupsPage />
        </MemoryRouter>,
    );
}

describe('GroupsPage', () => {
    beforeEach(() => {
        vi.mocked(useFriends).mockReturnValue({
            data: [],
        } as unknown as ReturnType<typeof useFriends>);
        vi.mocked(useCreateGroup).mockReturnValue({
            mutate: vi.fn(),
        } as unknown as ReturnType<typeof useCreateGroup>);
    });

    it('shows a loading message while fetching', () => {
        vi.mocked(useGroups).mockReturnValue({
            data: undefined,
            isLoading: true,
            isError: false,
        } as unknown as ReturnType<typeof useGroups>);

        renderPage();

        expect(screen.getByText(/loading groups/i)).toBeInTheDocument();
    });

    it('shows an error message when the query fails', () => {
        vi.mocked(useGroups).mockReturnValue({
            data: undefined,
            isLoading: false,
            isError: true,
        } as unknown as ReturnType<typeof useGroups>);

        renderPage();

        expect(screen.getByText(/couldn't load groups/i)).toBeInTheDocument();
    });

    it('shows an empty state when there are no groups', () => {
        vi.mocked(useGroups).mockReturnValue({
            data: [],
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useGroups>);

        renderPage();

        expect(screen.getByText(/no groups yet/i)).toBeInTheDocument();
    });

    it('renders each group with its name, pluralized member count, and a link to its detail page', () => {
        vi.mocked(useGroups).mockReturnValue({
            data: groups,
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useGroups>);

        renderPage();

        expect(screen.getByText('Weekend Trip')).toBeInTheDocument();
        expect(screen.getByText('3 members')).toBeInTheDocument();
        expect(screen.getByText('Roommates')).toBeInTheDocument();
        expect(screen.getByText('1 member')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /weekend trip/i })).toHaveAttribute(
            'href',
            '/groups/group-1',
        );
        expect(screen.getByRole('link', { name: /roommates/i })).toHaveAttribute(
            'href',
            '/groups/group-2',
        );
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
            renderPage();

            expect(screen.queryByText(/fake create group submit/i)).not.toBeInTheDocument();

            fireEvent.click(screen.getByRole('button', { name: /create group/i }));

            expect(screen.getByText(/fake create group submit/i)).toBeInTheDocument();
        });

        it('shows a loading toast immediately, then updates it to success', () => {
            let onSuccess: (() => void) | undefined;
            vi.mocked(useCreateGroup).mockReturnValue({
                mutate: vi.fn((_values, options: { onSuccess?: () => void }) => {
                    onSuccess = options.onSuccess;
                }),
            } as unknown as ReturnType<typeof useCreateGroup>);

            renderPage();

            fireEvent.click(screen.getByRole('button', { name: /create group/i }));
            fireEvent.click(screen.getByText(/fake create group submit/i));

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

            renderPage();

            fireEvent.click(screen.getByRole('button', { name: /create group/i }));
            fireEvent.click(screen.getByText(/fake create group submit/i));
            onError?.(new Error('Something went wrong'));

            expect(toast.error).toHaveBeenCalledWith('Something went wrong', { id: 'toast-id' });
        });
    });
});
