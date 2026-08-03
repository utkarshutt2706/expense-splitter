import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as friendsApi from '@features/friends/api/friendsApi';
import { ApiError } from '@lib/api/apiError';
import { FriendInGroupError, useRemoveFriend } from './useRemoveFriend';

vi.mock('@features/friends/api/friendsApi', () => ({
    remove: vi.fn(),
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

    it('deletes the friend via the API and invalidates the friends list', async () => {
        vi.mocked(friendsApi.remove).mockResolvedValue(undefined);

        const { result, invalidateSpy } = renderRemoveFriend();

        result.current.mutate('friend-1');

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(friendsApi.remove).toHaveBeenCalledWith('friend-1');
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['users', 'friends'] });
    });

    it('surfaces a server-side conflict as a FriendInGroupError', async () => {
        vi.mocked(friendsApi.remove).mockRejectedValue(
            new ApiError(
                'CONFLICT',
                'Cannot delete a user referenced by an existing group or expense',
                409,
            ),
        );

        const { result } = renderRemoveFriend();

        result.current.mutate('friend-1');

        await waitFor(() => expect(result.current.isError).toBe(true));

        expect(result.current.error).toBeInstanceOf(FriendInGroupError);
    });

    it('propagates other errors unchanged', async () => {
        vi.mocked(friendsApi.remove).mockRejectedValue(
            new ApiError('NOT_FOUND', 'User friend-1 not found', 404),
        );

        const { result } = renderRemoveFriend();

        result.current.mutate('friend-1');

        await waitFor(() => expect(result.current.isError).toBe(true));

        expect(result.current.error).not.toBeInstanceOf(FriendInGroupError);
        expect(result.current.error).toBeInstanceOf(ApiError);
    });
});
