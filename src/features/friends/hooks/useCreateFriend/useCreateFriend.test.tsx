import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { User } from '@data/entities';
import { DuplicateFriendError } from '@features/friends/utils/duplicateFriend';
import { useCreateFriend } from './useCreateFriend';

vi.mock('@services/instances', () => ({
    userService: {
        getAll: vi.fn(),
        create: vi.fn(),
    },
}));

function renderCreateFriend() {
    const queryClient = new QueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    return { ...renderHook(() => useCreateFriend(), { wrapper }), invalidateSpy };
}

describe('useCreateFriend', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('creates a user with a generated id and invalidates the friends list', async () => {
        const { userService } = await import('@services/instances');
        vi.mocked(userService.getAll).mockResolvedValue([]);
        const created: User = {
            id: 'generated-id',
            name: 'Priya Sharma',
            email: 'priya@example.com',
        };
        vi.mocked(userService.create).mockResolvedValue(created);

        const { result, invalidateSpy } = renderCreateFriend();

        result.current.mutate({ name: 'Priya Sharma', email: 'priya@example.com' });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(userService.create).toHaveBeenCalledWith(
            expect.objectContaining({ name: 'Priya Sharma', email: 'priya@example.com' }),
        );
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['users', 'friends'] });
    });

    it('blocks creation when a friend already exists with the same email', async () => {
        const { userService } = await import('@services/instances');
        const existing: User = {
            id: 'friend-1',
            name: 'Priya Sharma',
            email: 'priya@example.com',
        };
        vi.mocked(userService.getAll).mockResolvedValue([existing]);

        const { result } = renderCreateFriend();

        result.current.mutate({ name: 'Someone Else', email: 'priya@example.com' });

        await waitFor(() => expect(result.current.isError).toBe(true));

        expect(result.current.error).toBeInstanceOf(DuplicateFriendError);
        expect(userService.create).not.toHaveBeenCalled();
    });

    it('blocks creation when a friend already exists with the same phone number', async () => {
        const { userService } = await import('@services/instances');
        const existing: User = {
            id: 'friend-1',
            name: 'Priya Sharma',
            phone: '5551234567',
        };
        vi.mocked(userService.getAll).mockResolvedValue([existing]);

        const { result } = renderCreateFriend();

        result.current.mutate({ name: 'Someone Else', phone: '5551234567' });

        await waitFor(() => expect(result.current.isError).toBe(true));

        expect(result.current.error).toBeInstanceOf(DuplicateFriendError);
        expect(userService.create).not.toHaveBeenCalled();
    });
});
