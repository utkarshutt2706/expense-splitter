import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { MemberBalance } from '@features/balances/api/balancesApi';
import type { Group } from '@features/groups/api/groupsApi';
import { useDeleteGroup } from '@features/groups/hooks/useDeleteGroup';
import { useUpdateGroupMembers } from '@features/groups/hooks/useUpdateGroupMembers';
import type { User } from '@features/users/api/usersApi';

import { useGroupSettingsActions } from './useGroupSettingsActions';

const { navigateMock, toastLoadingMock, toastSuccessMock, toastErrorMock } = vi.hoisted(() => ({
    navigateMock: vi.fn(),
    toastLoadingMock: vi.fn(() => 'toast-id'),
    toastSuccessMock: vi.fn(),
    toastErrorMock: vi.fn(),
}));

vi.mock('react-router', () => ({ useNavigate: () => navigateMock }));
vi.mock('@features/groups/hooks/useDeleteGroup', () => ({ useDeleteGroup: vi.fn() }));
vi.mock('@features/groups/hooks/useUpdateGroupMembers', () => ({
    useUpdateGroupMembers: vi.fn(),
}));
vi.mock('sonner', () => ({
    toast: { loading: toastLoadingMock, success: toastSuccessMock, error: toastErrorMock },
}));

const group = {
    id: 'group-1',
    name: 'Trip',
    memberIds: ['current', 'friend', 'other'],
} as Group;
const currentUser = { id: 'current', name: 'Current User' } as User;
const settledBalances: MemberBalance[] = [
    { userId: 'current', balance: 0 },
    { userId: 'friend', balance: 0 },
];
const updateMutate = vi.fn();
const deleteMutate = vi.fn();

describe('useGroupSettingsActions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useUpdateGroupMembers).mockReturnValue({
            mutate: updateMutate,
            isPending: false,
        } as unknown as ReturnType<typeof useUpdateGroupMembers>);
        vi.mocked(useDeleteGroup).mockReturnValue({
            mutate: deleteMutate,
            isPending: false,
        } as unknown as ReturnType<typeof useDeleteGroup>);
    });

    it('derives leave and delete permissions from balances', () => {
        const settled = renderHook(() =>
            useGroupSettingsActions(group, currentUser, settledBalances),
        );
        expect(settled.result.current).toMatchObject({ canLeave: true, canDelete: true });
        settled.unmount();

        const currentOwes = renderHook(() =>
            useGroupSettingsActions(group, currentUser, [
                { userId: 'current', balance: -10 },
                { userId: 'friend', balance: 10 },
            ]),
        );
        expect(currentOwes.result.current).toMatchObject({ canLeave: false, canDelete: false });
        currentOwes.unmount();

        const otherOwes = renderHook(() =>
            useGroupSettingsActions(group, currentUser, [
                { userId: 'current', balance: 0 },
                { userId: 'friend', balance: 10 },
            ]),
        );
        expect(otherOwes.result.current).toMatchObject({ canLeave: true, canDelete: false });
    });

    it('exposes confirmation and mutation pending states', () => {
        vi.mocked(useUpdateGroupMembers).mockReturnValue({
            mutate: updateMutate,
            isPending: true,
        } as unknown as ReturnType<typeof useUpdateGroupMembers>);
        vi.mocked(useDeleteGroup).mockReturnValue({
            mutate: deleteMutate,
            isPending: true,
        } as unknown as ReturnType<typeof useDeleteGroup>);
        const { result } = renderHook(() =>
            useGroupSettingsActions(group, currentUser, settledBalances),
        );

        act(() => {
            result.current.setIsConfirmingLeave(true);
            result.current.setIsConfirmingDelete(true);
        });

        expect(result.current).toMatchObject({
            isConfirmingLeave: true,
            isConfirmingDelete: true,
            leavePending: true,
            deletePending: true,
        });
    });

    it('leaves the group without the current member and handles success', () => {
        let onSuccess!: () => void;
        updateMutate.mockImplementation((_input, options) => (onSuccess = options.onSuccess));
        const { result } = renderHook(() =>
            useGroupSettingsActions(group, currentUser, settledBalances),
        );
        act(() => result.current.setIsConfirmingLeave(true));

        act(() => result.current.leaveGroup());

        expect(result.current.isConfirmingLeave).toBe(false);
        expect(toastLoadingMock).toHaveBeenCalledWith('Leaving group…');
        expect(updateMutate).toHaveBeenCalledWith(
            { id: 'group-1', memberIds: ['friend', 'other'] },
            expect.anything(),
        );
        onSuccess();
        expect(toastSuccessMock).toHaveBeenCalledWith('Left group', { id: 'toast-id' });
        expect(navigateMock).toHaveBeenCalledWith('/groups');
    });

    it('reports an error when leaving fails', () => {
        let onError!: (error: Error) => void;
        updateMutate.mockImplementation((_input, options) => (onError = options.onError));
        const { result } = renderHook(() =>
            useGroupSettingsActions(group, currentUser, settledBalances),
        );

        act(() => result.current.leaveGroup());
        onError(new Error('Leave failed'));

        expect(toastErrorMock).toHaveBeenCalledWith('Leave failed', { id: 'toast-id' });
        expect(navigateMock).not.toHaveBeenCalled();
    });

    it('deletes the group and handles success', () => {
        let onSuccess!: () => void;
        deleteMutate.mockImplementation((_id, options) => (onSuccess = options.onSuccess));
        const { result } = renderHook(() =>
            useGroupSettingsActions(group, currentUser, settledBalances),
        );
        act(() => result.current.setIsConfirmingDelete(true));

        act(() => result.current.removeGroup());

        expect(result.current.isConfirmingDelete).toBe(false);
        expect(toastLoadingMock).toHaveBeenCalledWith('Group is being deleted…');
        expect(deleteMutate).toHaveBeenCalledWith('group-1', expect.anything());
        onSuccess();
        expect(toastSuccessMock).toHaveBeenCalledWith('Group deleted', { id: 'toast-id' });
        expect(navigateMock).toHaveBeenCalledWith('/groups');
    });

    it('reports an error when group deletion fails', () => {
        let onError!: (error: Error) => void;
        deleteMutate.mockImplementation((_id, options) => (onError = options.onError));
        const { result } = renderHook(() =>
            useGroupSettingsActions(group, currentUser, settledBalances),
        );

        act(() => result.current.removeGroup());
        onError(new Error('Delete failed'));

        expect(toastErrorMock).toHaveBeenCalledWith('Delete failed', { id: 'toast-id' });
        expect(navigateMock).not.toHaveBeenCalled();
    });

    it('does not mutate without the required group or current user', () => {
        const missingGroup = renderHook(() =>
            useGroupSettingsActions(undefined, currentUser, settledBalances),
        );
        act(() => {
            missingGroup.result.current.leaveGroup();
            missingGroup.result.current.removeGroup();
        });
        missingGroup.unmount();

        const missingUser = renderHook(() =>
            useGroupSettingsActions(group, undefined, settledBalances),
        );
        act(() => missingUser.result.current.leaveGroup());

        expect(updateMutate).not.toHaveBeenCalled();
        expect(deleteMutate).not.toHaveBeenCalled();
        expect(toastLoadingMock).not.toHaveBeenCalled();
    });
});
