import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Group, User } from '@data/entities';
import { useFriends } from '@features/friends';
import { useUpdateGroupMembers } from '@features/groups/hooks/useUpdateGroupMembers';
import { EditGroupMembersAction } from './EditGroupMembersAction';

vi.mock('@features/friends', () => ({
    useFriends: vi.fn(),
}));

vi.mock('@features/groups/hooks/useUpdateGroupMembers', () => ({
    useUpdateGroupMembers: vi.fn(),
}));

vi.mock('../EditGroupMembersDialog', () => ({
    EditGroupMembersDialog: ({
        open,
        onSubmit,
    }: {
        open: boolean;
        onSubmit: (values: { memberIds: string[] }) => void;
    }) =>
        open ? (
            <div data-testid="edit-group-members-dialog">
                <button type="button" onClick={() => onSubmit({ memberIds: ['friend-2'] })}>
                    Fake edit members submit
                </button>
            </div>
        ) : null,
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

describe('EditGroupMembersAction', () => {
    beforeEach(() => {
        vi.mocked(useFriends).mockReturnValue({
            data: [],
        } as unknown as ReturnType<typeof useFriends>);
        vi.mocked(useUpdateGroupMembers).mockReturnValue({
            mutate: vi.fn(),
        } as unknown as ReturnType<typeof useUpdateGroupMembers>);
    });

    it('renders an add/remove members button', () => {
        render(<EditGroupMembersAction group={group} members={members} />);

        expect(screen.getByRole('button', { name: /add\/remove members/i })).toBeInTheDocument();
    });

    it('opens the edit-members dialog when clicked', async () => {
        const user = userEvent.setup();
        render(<EditGroupMembersAction group={group} members={members} />);

        expect(screen.queryByTestId('edit-group-members-dialog')).not.toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /add\/remove members/i }));

        expect(screen.getByTestId('edit-group-members-dialog')).toBeInTheDocument();
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
        render(<EditGroupMembersAction group={group} members={members} />);

        await user.click(screen.getByRole('button', { name: /add\/remove members/i }));
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
        render(<EditGroupMembersAction group={group} members={members} />);

        await user.click(screen.getByRole('button', { name: /add\/remove members/i }));
        await user.click(screen.getByRole('button', { name: /fake edit members submit/i }));
        onError?.(new Error('Something went wrong'));

        expect(toast.error).toHaveBeenCalledWith('Something went wrong', { id: 'toast-id' });
    });
});
