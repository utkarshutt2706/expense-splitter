import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Group } from '@data/entities';
import { FriendInGroupError, useRemoveFriend } from './useRemoveFriend';

vi.mock('@services/instances', () => ({
    groupService: {
        getAll: vi.fn(),
    },
    userService: {
        delete: vi.fn(),
    },
}));

function renderRemoveFriend() {
    const queryClient = new QueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    return { ...renderHook(() => useRemoveFriend(), { wrapper }), invalidateSpy };
}

describe('useRemoveFriend', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('deletes the friend when they are not part of any group', async () => {
        const { groupService, userService } = await import('@services/instances');
        vi.mocked(groupService.getAll).mockResolvedValue([]);
        vi.mocked(userService.delete).mockResolvedValue(undefined);

        const { result, invalidateSpy } = renderRemoveFriend();

        result.current.mutate('friend-1');

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(userService.delete).toHaveBeenCalledWith('friend-1');
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['users', 'friends'] });
    });

    it('blocks deletion when the friend is a member of a group', async () => {
        const { groupService, userService } = await import('@services/instances');
        const group: Group = {
            id: 'group-1',
            name: 'Trip',
            memberIds: ['friend-1'],
            createdAt: new Date().toISOString(),
        };
        vi.mocked(groupService.getAll).mockResolvedValue([group]);

        const { result } = renderRemoveFriend();

        result.current.mutate('friend-1');

        await waitFor(() => expect(result.current.isError).toBe(true));

        expect(result.current.error).toBeInstanceOf(FriendInGroupError);
        expect(userService.delete).not.toHaveBeenCalled();
    });
});
