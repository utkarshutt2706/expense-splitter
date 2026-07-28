import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { User } from '@data/entities';
import { DuplicateFriendError } from '@features/friends/utils/duplicateFriend';
import { useUpdateFriend } from './useUpdateFriend';

vi.mock('@services/instances', () => ({
    userService: {
        getAll: vi.fn(),
        update: vi.fn(),
    },
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

    it('updates a user by id and invalidates the friends list', async () => {
        const { userService } = await import('@services/instances');
        const existing: User = { id: 'friend-1', name: 'Priya Sharma', email: 'priya@example.com' };
        vi.mocked(userService.getAll).mockResolvedValue([existing]);
        const updated: User = { id: 'friend-1', name: 'Priya S.', email: 'priya@example.com' };
        vi.mocked(userService.update).mockResolvedValue(updated);

        const { result, invalidateSpy } = renderUpdateFriend();

        result.current.mutate({ id: 'friend-1', name: 'Priya S.', email: 'priya@example.com' });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(userService.update).toHaveBeenCalledWith('friend-1', {
            name: 'Priya S.',
            email: 'priya@example.com',
        });
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['users', 'friends'] });
    });

    it('does not block updating a friend against their own existing email', async () => {
        const { userService } = await import('@services/instances');
        const existing: User = { id: 'friend-1', name: 'Priya Sharma', email: 'priya@example.com' };
        vi.mocked(userService.getAll).mockResolvedValue([existing]);
        vi.mocked(userService.update).mockResolvedValue(existing);

        const { result } = renderUpdateFriend();

        result.current.mutate({ id: 'friend-1', name: 'Priya S.', email: 'priya@example.com' });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(userService.update).toHaveBeenCalled();
    });

    it('blocks the update when another friend already has the same email', async () => {
        const { userService } = await import('@services/instances');
        const other: User = { id: 'friend-2', name: 'Jordan Lee', email: 'jordan@example.com' };
        vi.mocked(userService.getAll).mockResolvedValue([other]);

        const { result } = renderUpdateFriend();

        result.current.mutate({ id: 'friend-1', name: 'Priya S.', email: 'jordan@example.com' });

        await waitFor(() => expect(result.current.isError).toBe(true));

        expect(result.current.error).toBeInstanceOf(DuplicateFriendError);
        expect(userService.update).not.toHaveBeenCalled();
    });
});
