import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { User } from '@data/entities';
import * as friendsApi from '@features/friends/api/friendsApi';
import { DuplicateFriendError } from '@features/friends/utils/duplicateFriend';
import { ApiError } from '@lib/api/apiError';
import { useUpdateFriend } from './useUpdateFriend';

vi.mock('@features/friends/api/friendsApi', () => ({
    getAll: vi.fn(),
    update: vi.fn(),
}));

function renderUpdateFriend() {
    const queryClient = new QueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    return { ...renderHook(() => useUpdateFriend(), { wrapper }), invalidateSpy };
}

describe('useUpdateFriend', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('updates a friend via the API and invalidates the friends list', async () => {
        const existing: User = { id: 'friend-1', name: 'Priya Sharma', email: 'priya@example.com' };
        vi.mocked(friendsApi.getAll).mockResolvedValue([existing]);
        const updated: User = { id: 'friend-1', name: 'Priya S.', email: 'priya@example.com' };
        vi.mocked(friendsApi.update).mockResolvedValue(updated);

        const { result, invalidateSpy } = renderUpdateFriend();

        result.current.mutate({ id: 'friend-1', name: 'Priya S.', email: 'priya@example.com' });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(friendsApi.update).toHaveBeenCalledWith('friend-1', {
            name: 'Priya S.',
            email: 'priya@example.com',
        });
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['users', 'friends'] });
    });

    it('does not block updating a friend against their own existing email', async () => {
        const existing: User = { id: 'friend-1', name: 'Priya Sharma', email: 'priya@example.com' };
        vi.mocked(friendsApi.getAll).mockResolvedValue([existing]);
        vi.mocked(friendsApi.update).mockResolvedValue(existing);

        const { result } = renderUpdateFriend();

        result.current.mutate({ id: 'friend-1', name: 'Priya S.', email: 'priya@example.com' });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(friendsApi.update).toHaveBeenCalled();
    });

    it('blocks the update when another friend already has the same email', async () => {
        const other: User = { id: 'friend-2', name: 'Jordan Lee', email: 'jordan@example.com' };
        vi.mocked(friendsApi.getAll).mockResolvedValue([other]);

        const { result } = renderUpdateFriend();

        result.current.mutate({ id: 'friend-1', name: 'Priya S.', email: 'jordan@example.com' });

        await waitFor(() => expect(result.current.isError).toBe(true));

        expect(result.current.error).toBeInstanceOf(DuplicateFriendError);
        expect(friendsApi.update).not.toHaveBeenCalled();
    });

    it('surfaces a server-side conflict as a DuplicateFriendError', async () => {
        vi.mocked(friendsApi.getAll).mockResolvedValue([]);
        vi.mocked(friendsApi.update).mockRejectedValue(
            new ApiError('CONFLICT', 'A user with this email already exists', 409),
        );

        const { result } = renderUpdateFriend();

        result.current.mutate({ id: 'friend-1', name: 'Priya S.', email: 'priya@example.com' });

        await waitFor(() => expect(result.current.isError).toBe(true));

        expect(result.current.error).toBeInstanceOf(DuplicateFriendError);
    });
});
