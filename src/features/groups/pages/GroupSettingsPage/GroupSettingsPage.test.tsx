import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Group } from '@features/groups/api/groupsApi';
import type { User } from '@features/users/api/usersApi';
import { useCurrentUser } from '@app/hooks';
import { useGroupBalances } from '@features/balances/hooks/useGroupBalances';
import { useGroup, useGroupMembers } from '@features/groups';
import { useDeleteGroup } from '@features/groups/hooks/useDeleteGroup';
import { useUpdateGroupMembers } from '@features/groups/hooks/useUpdateGroupMembers';
import { ApiError } from '@lib/api/apiError';
import { GroupSettingsPage } from './GroupSettingsPage';

const navigateMock = vi.fn();
const routeState = vi.hoisted(() => ({ groupId: 'group-1' as string | undefined }));

vi.mock('react-router', async () => {
    const actual = await vi.importActual('react-router');
    return {
        ...actual,
        useParams: () => ({ groupId: routeState.groupId }),
        useNavigate: () => navigateMock,
    };
});

vi.mock('@app/hooks', () => ({
    useCurrentUser: vi.fn(),
}));

vi.mock('@features/balances/hooks/useGroupBalances', () => ({
    useGroupBalances: vi.fn(),
}));

vi.mock('@features/groups', () => ({
    useGroup: vi.fn(),
    useGroupMembers: vi.fn(),
}));

vi.mock('@features/groups/hooks/useDeleteGroup', () => ({
    useDeleteGroup: vi.fn(),
}));

vi.mock('@features/groups/hooks/useUpdateGroupMembers', () => ({
    useUpdateGroupMembers: vi.fn(),
}));

vi.mock('@features/groups/components/GroupNameEditor', () => ({
    GroupNameEditor: ({
        group,
        isEditing,
        onEditingChange,
    }: {
        group: Group;
        isEditing: boolean;
        onEditingChange: (isEditing: boolean) => void;
    }) => (
        <div data-testid="group-name-editor">
            {group.name}-{isEditing ? 'editing' : 'idle'}
            <button type="button" onClick={() => onEditingChange(true)}>
                Fake edit name
            </button>
        </div>
    ),
}));

vi.mock('@features/groups/components/EditGroupMembersAction', () => ({
    EditGroupMembersAction: ({ group, members }: { group: Group; members: User[] }) => (
        <div data-testid="edit-group-members-action">{`${group.id}-${members.length}`}</div>
    ),
}));

vi.mock('@features/groups/components/MemberList', () => ({
    MemberList: ({ members }: { members: User[] }) => (
        <div data-testid="member-list">{members.length}</div>
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

const members: User[] = [
    { id: 'current-user', name: 'Alex Morgan', email: 'alex@example.com' },
    { id: 'friend-1', name: 'Priya Sharma', email: 'priya@example.com' },
];

function mockSettledBalances() {
    vi.mocked(useGroupBalances).mockReturnValue({
        data: {
            balances: [
                { userId: 'current-user', balance: 0 },
                { userId: 'friend-1', balance: 0 },
            ],
            settlements: [],
        },
    } as unknown as ReturnType<typeof useGroupBalances>);
}

function renderPage() {
    return render(
        <MemoryRouter>
            <GroupSettingsPage />
        </MemoryRouter>,
    );
}

describe('GroupSettingsPage', () => {
    beforeEach(() => {
        routeState.groupId = 'group-1';
        vi.clearAllMocks();
        vi.mocked(useCurrentUser).mockReturnValue({
            data: { id: 'current-user', name: 'Alex Morgan', email: 'alex@example.com' },
        } as unknown as ReturnType<typeof useCurrentUser>);
        mockSettledBalances();
        vi.mocked(useDeleteGroup).mockReturnValue({
            mutate: vi.fn(),
            isPending: false,
        } as unknown as ReturnType<typeof useDeleteGroup>);
        vi.mocked(useUpdateGroupMembers).mockReturnValue({
            mutate: vi.fn(),
            isPending: false,
        } as unknown as ReturnType<typeof useUpdateGroupMembers>);
    });

    it('shows a loading message while fetching', () => {
        vi.mocked(useGroup).mockReturnValue({
            data: undefined,
            isLoading: true,
            isError: false,
        } as unknown as ReturnType<typeof useGroup>);
        vi.mocked(useGroupMembers).mockReturnValue({
            data: [],
            isLoading: false,
        } as unknown as ReturnType<typeof useGroupMembers>);

        renderPage();

        expect(screen.getByRole('status', { name: /loading group settings/i })).toBeInTheDocument();
    });

    it('shows an error message when the group fails to load', () => {
        vi.mocked(useGroup).mockReturnValue({
            data: undefined,
            isLoading: false,
            isError: true,
        } as unknown as ReturnType<typeof useGroup>);
        vi.mocked(useGroupMembers).mockReturnValue({
            data: [],
            isLoading: false,
        } as unknown as ReturnType<typeof useGroupMembers>);

        renderPage();

        expect(screen.getByText(/couldn't load this group/i)).toBeInTheDocument();
    });

    it('shows an access-denied message when the caller is not a member of the group', () => {
        vi.mocked(useGroup).mockReturnValue({
            data: undefined,
            isLoading: false,
            isError: true,
            error: new ApiError('FORBIDDEN', 'You are not a member of this group', 403),
        } as unknown as ReturnType<typeof useGroup>);
        vi.mocked(useGroupMembers).mockReturnValue({
            data: [],
            isLoading: false,
        } as unknown as ReturnType<typeof useGroupMembers>);

        renderPage();

        expect(screen.getByText(/you don't have access to this group/i)).toBeInTheDocument();
    });

    it('shows the fallback error when a successful query has no group', () => {
        vi.mocked(useGroup).mockReturnValue({
            data: undefined,
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useGroup>);
        vi.mocked(useGroupMembers).mockReturnValue({
            data: undefined,
            isLoading: false,
        } as unknown as ReturnType<typeof useGroupMembers>);
        vi.mocked(useGroupBalances).mockReturnValue({
            data: undefined,
        } as unknown as ReturnType<typeof useGroupBalances>);

        renderPage();

        expect(screen.getByText(/couldn't load this group/i)).toBeInTheDocument();
    });

    it('uses empty query identifiers and a safe back link when the route id is absent', () => {
        routeState.groupId = undefined;
        vi.mocked(useGroup).mockReturnValue({
            data: undefined,
            isLoading: true,
            isError: false,
        } as unknown as ReturnType<typeof useGroup>);
        vi.mocked(useGroupMembers).mockReturnValue({
            data: undefined,
            isLoading: false,
        } as unknown as ReturnType<typeof useGroupMembers>);

        renderPage();

        expect(useGroup).toHaveBeenCalledWith('');
        expect(useGroupBalances).toHaveBeenCalledWith('');
        expect(screen.getByRole('link', { name: /back to group/i })).toHaveAttribute(
            'href',
            '/groups',
        );
    });

    it('renders the back link to the group', () => {
        vi.mocked(useGroup).mockReturnValue({
            data: undefined,
            isLoading: true,
            isError: false,
        } as unknown as ReturnType<typeof useGroup>);
        vi.mocked(useGroupMembers).mockReturnValue({
            data: [],
            isLoading: false,
        } as unknown as ReturnType<typeof useGroupMembers>);

        renderPage();

        expect(screen.getByRole('link', { name: /back to group/i })).toHaveAttribute(
            'href',
            '/groups/group-1',
        );
    });

    it('renders the group as soon as it loads, even while members are still fetching', () => {
        vi.mocked(useGroup).mockReturnValue({
            data: group,
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useGroup>);
        vi.mocked(useGroupMembers).mockReturnValue({
            data: undefined,
            isLoading: true,
        } as unknown as ReturnType<typeof useGroupMembers>);

        renderPage();

        expect(
            screen.queryByRole('status', { name: /loading group settings/i }),
        ).not.toBeInTheDocument();
        expect(screen.getByTestId('group-name-editor')).toHaveTextContent('Weekend Trip');
        expect(screen.getByRole('button', { name: /leave group/i })).toBeInTheDocument();
        expect(screen.queryByTestId('member-list')).not.toBeInTheDocument();
    });

    describe('once the group has loaded', () => {
        beforeEach(() => {
            vi.mocked(useGroup).mockReturnValue({
                data: group,
                isLoading: false,
                isError: false,
            } as unknown as ReturnType<typeof useGroup>);
            vi.mocked(useGroupMembers).mockReturnValue({
                data: members,
                isLoading: false,
            } as unknown as ReturnType<typeof useGroupMembers>);
        });

        it('renders the name editor, the add/remove members action, and the member list', () => {
            renderPage();

            expect(screen.getByTestId('group-name-editor')).toHaveTextContent('Weekend Trip');
            expect(screen.getByTestId('edit-group-members-action')).toHaveTextContent('group-1-2');
            expect(screen.getByTestId('member-list')).toHaveTextContent('2');
        });

        it('forwards name editing changes and falls back to empty unresolved members', () => {
            vi.mocked(useGroupMembers).mockReturnValue({
                data: undefined,
                isLoading: false,
            } as unknown as ReturnType<typeof useGroupMembers>);
            renderPage();

            expect(screen.getByTestId('edit-group-members-action')).toHaveTextContent('group-1-0');
            expect(screen.getByTestId('member-list')).toHaveTextContent('0');
            fireEvent.click(screen.getByRole('button', { name: /fake edit name/i }));
            expect(screen.getByTestId('group-name-editor')).toHaveTextContent(
                'Weekend Trip-editing',
            );
        });

        it('disables actions while their mutations are pending', () => {
            vi.mocked(useDeleteGroup).mockReturnValue({
                mutate: vi.fn(),
                isPending: true,
            } as unknown as ReturnType<typeof useDeleteGroup>);
            vi.mocked(useUpdateGroupMembers).mockReturnValue({
                mutate: vi.fn(),
                isPending: true,
            } as unknown as ReturnType<typeof useUpdateGroupMembers>);

            renderPage();

            expect(screen.getByRole('button', { name: /leave group/i })).toBeDisabled();
            expect(screen.getByRole('button', { name: /delete group/i })).toBeDisabled();
        });

        it('enables leave-group and delete-group when everyone is settled up', () => {
            renderPage();

            expect(screen.getByRole('button', { name: /leave group/i })).not.toBeDisabled();
            expect(screen.getByRole('button', { name: /delete group/i })).not.toBeDisabled();
        });

        it('disables leave-group when the caller has an unsettled balance', () => {
            vi.mocked(useGroupBalances).mockReturnValue({
                data: {
                    balances: [
                        { userId: 'current-user', balance: -25 },
                        { userId: 'friend-1', balance: 25 },
                    ],
                    settlements: [],
                },
            } as unknown as ReturnType<typeof useGroupBalances>);

            renderPage();

            expect(screen.getByRole('button', { name: /leave group/i })).toBeDisabled();
        });

        it('disables delete-group when any member has an unsettled balance', () => {
            vi.mocked(useGroupBalances).mockReturnValue({
                data: {
                    balances: [
                        { userId: 'current-user', balance: 0 },
                        { userId: 'friend-1', balance: 25 },
                    ],
                    settlements: [],
                },
            } as unknown as ReturnType<typeof useGroupBalances>);

            renderPage();

            expect(screen.getByRole('button', { name: /leave group/i })).not.toBeDisabled();
            expect(screen.getByRole('button', { name: /delete group/i })).toBeDisabled();
        });

        it('leaves the group after confirming, then navigates to the groups list', () => {
            let onSuccess: (() => void) | undefined;
            const mutate = vi.fn((_values, options: { onSuccess?: () => void }) => {
                onSuccess = options.onSuccess;
            });
            vi.mocked(useUpdateGroupMembers).mockReturnValue({
                mutate,
                isPending: false,
            } as unknown as ReturnType<typeof useUpdateGroupMembers>);

            renderPage();

            fireEvent.click(screen.getByRole('button', { name: /leave group/i }));
            fireEvent.click(screen.getByRole('button', { name: 'Leave' }));

            expect(mutate).toHaveBeenCalledWith(
                { id: 'group-1', memberIds: ['friend-1'] },
                expect.anything(),
            );

            onSuccess?.();

            expect(toast.success).toHaveBeenCalledWith('Left group', { id: 'toast-id' });
            expect(navigateMock).toHaveBeenCalledWith('/groups');
        });

        it('shows the backend error when leaving fails', () => {
            let onError: ((error: Error) => void) | undefined;
            const mutate = vi.fn((_values, options: { onError?: (error: Error) => void }) => {
                onError = options.onError;
            });
            vi.mocked(useUpdateGroupMembers).mockReturnValue({
                mutate,
                isPending: false,
            } as unknown as ReturnType<typeof useUpdateGroupMembers>);

            renderPage();

            fireEvent.click(screen.getByRole('button', { name: /leave group/i }));
            fireEvent.click(screen.getByRole('button', { name: 'Leave' }));

            onError?.(
                new ApiError(
                    'CONFLICT',
                    'Cannot remove member(s) with an unsettled balance: current-user',
                    409,
                ),
            );

            expect(toast.error).toHaveBeenCalledWith(
                'Cannot remove member(s) with an unsettled balance: current-user',
                { id: 'toast-id' },
            );
        });

        it('deletes the group after confirming, then navigates to the groups list', () => {
            let onSuccess: (() => void) | undefined;
            const mutate = vi.fn((_id, options: { onSuccess?: () => void }) => {
                onSuccess = options.onSuccess;
            });
            vi.mocked(useDeleteGroup).mockReturnValue({
                mutate,
                isPending: false,
            } as unknown as ReturnType<typeof useDeleteGroup>);

            renderPage();

            fireEvent.click(screen.getByRole('button', { name: /delete group/i }));
            fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

            expect(mutate).toHaveBeenCalledWith('group-1', expect.anything());

            onSuccess?.();

            expect(toast.success).toHaveBeenCalledWith('Group deleted', { id: 'toast-id' });
            expect(navigateMock).toHaveBeenCalledWith('/groups');
        });

        it('shows the backend error when deleting fails', () => {
            let onError: ((error: Error) => void) | undefined;
            const mutate = vi.fn((_id, options: { onError?: (error: Error) => void }) => {
                onError = options.onError;
            });
            vi.mocked(useDeleteGroup).mockReturnValue({
                mutate,
                isPending: false,
            } as unknown as ReturnType<typeof useDeleteGroup>);

            renderPage();

            fireEvent.click(screen.getByRole('button', { name: /delete group/i }));
            fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

            onError?.(
                new ApiError(
                    'CONFLICT',
                    'Cannot delete a group with unsettled balances -- everyone must be settled up first',
                    409,
                ),
            );

            expect(toast.error).toHaveBeenCalledWith(
                'Cannot delete a group with unsettled balances -- everyone must be settled up first',
                { id: 'toast-id' },
            );
        });
    });
});
