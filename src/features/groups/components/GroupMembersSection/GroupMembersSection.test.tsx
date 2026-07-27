import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Group, User } from '@data/entities';
import { useFriends } from '@features/friends';
import { useUpdateGroupMembers } from '@features/groups/hooks/useUpdateGroupMembers';
import { GroupMembersSection } from './GroupMembersSection';

vi.mock('@features/friends', () => ({
    useFriends: vi.fn(),
}));

vi.mock('@features/groups/hooks/useUpdateGroupMembers', () => ({
    useUpdateGroupMembers: vi.fn(),
}));

vi.mock('../GroupMembersStack', () => ({
    GroupMembersStack: ({ onEditMembers }: { onEditMembers: () => void }) => (
        <div data-testid="group-members-stack">
            <button type="button" onClick={onEditMembers}>
                Fake open edit members
            </button>
        </div>
    ),
}));

vi.mock('../EditGroupMembersDialog', () => ({
    EditGroupMembersDialog: ({
        onSubmit,
    }: {
        onSubmit: (values: { memberIds: string[] }) => void;
    }) => (
        <div data-testid="edit-group-members-dialog">
            <button type="button" onClick={() => onSubmit({ memberIds: ['friend-2'] })}>
                Fake edit members submit
            </button>
        </div>
    ),
}));

vi.mock('sonner', () => ({
    toast: {
        loading: vi.fn(() => 'toast-id'),
        success: vi.fn(),
        error: vi.fn(),
    },
}));

const group: Group = {
    id: 'group-1',
    name: 'Weekend Trip',
    memberIds: ['current-user', 'friend-1'],
    createdAt: '',
};

const members: User[] = [{ id: 'current-user', name: 'Alex Morgan', email: 'alex@example.com' }];

function renderSection(overrides: Partial<Parameters<typeof GroupMembersSection>[0]> = {}) {
    return render(
        <GroupMembersSection
            group={group}
            members={members}
            isMembersLoading={false}
            isMembersFetching={false}
            isGroupFetching={false}
            {...overrides}
        />,
    );
}

describe('GroupMembersSection', () => {
    beforeEach(() => {
        vi.mocked(useFriends).mockReturnValue({
            data: [],
        } as unknown as ReturnType<typeof useFriends>);
        vi.mocked(useUpdateGroupMembers).mockReturnValue({
            mutate: vi.fn(),
        } as unknown as ReturnType<typeof useUpdateGroupMembers>);
    });

    it('shows the member stack when nothing is loading', () => {
        renderSection();

        expect(screen.getByTestId('group-members-stack')).toBeInTheDocument();
    });

    it('shows the member avatars skeleton instead of the stack while members are loading', () => {
        renderSection({ isMembersLoading: true });

        expect(screen.queryByTestId('group-members-stack')).not.toBeInTheDocument();
    });

    it('shows the member avatars skeleton while the group is refetching', () => {
        renderSection({ isGroupFetching: true });

        expect(screen.queryByTestId('group-members-stack')).not.toBeInTheDocument();
    });

    it('shows the member avatars skeleton while members are refetching', () => {
        renderSection({ isMembersFetching: true });

        expect(screen.queryByTestId('group-members-stack')).not.toBeInTheDocument();
    });

    it('shows the member avatars skeleton while an update is pending', () => {
        vi.mocked(useUpdateGroupMembers).mockReturnValue({
            mutate: vi.fn(),
            isPending: true,
        } as unknown as ReturnType<typeof useUpdateGroupMembers>);

        renderSection();

        expect(screen.queryByTestId('group-members-stack')).not.toBeInTheDocument();
    });

    it('updates group members and shows a loading toast, then success', async () => {
        let onSuccess: (() => void) | undefined;
        const mutate = vi.fn((_values, options: { onSuccess?: () => void }) => {
            onSuccess = options.onSuccess;
        });
        vi.mocked(useUpdateGroupMembers).mockReturnValue({
            mutate,
        } as unknown as ReturnType<typeof useUpdateGroupMembers>);

        const user = userEvent.setup();
        renderSection();

        await user.click(screen.getByRole('button', { name: /fake edit members submit/i }));

        expect(toast.loading).toHaveBeenCalledWith('Group members are being updated…');
        expect(mutate).toHaveBeenCalledWith(
            { id: 'group-1', memberIds: ['friend-2'] },
            expect.anything(),
        );

        act(() => onSuccess?.());

        expect(toast.success).toHaveBeenCalledWith('Group members updated', { id: 'toast-id' });
    });

    it('shows an error toast when updating members fails', async () => {
        let onError: ((error: Error) => void) | undefined;
        const mutate = vi.fn((_values, options: { onError?: (error: Error) => void }) => {
            onError = options.onError;
        });
        vi.mocked(useUpdateGroupMembers).mockReturnValue({
            mutate,
        } as unknown as ReturnType<typeof useUpdateGroupMembers>);

        const user = userEvent.setup();
        renderSection();

        await user.click(screen.getByRole('button', { name: /fake edit members submit/i }));
        onError?.(new Error('Something went wrong'));

        expect(toast.error).toHaveBeenCalledWith('Something went wrong', { id: 'toast-id' });
    });
});
