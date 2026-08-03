import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { User } from '@data/entities';
import * as friendsApi from '@features/friends/api/friendsApi';
import { DuplicateFriendError } from '@features/friends/utils/duplicateFriend';
import { ApiError } from '@lib/api/apiError';
import { useCreateFriend } from './useCreateFriend';

vi.mock('@features/friends/api/friendsApi', () => ({
    getAll: vi.fn(),
    create: vi.fn(),
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

    it('creates a friend via the API and invalidates the friends list', async () => {
        vi.mocked(friendsApi.getAll).mockResolvedValue([]);
        const created: User = {
            id: 'server-generated-id',
            name: 'Priya Sharma',
            email: 'priya@example.com',
        };
        vi.mocked(friendsApi.create).mockResolvedValue(created);

        const { result, invalidateSpy } = renderCreateFriend();

        result.current.mutate({ name: 'Priya Sharma', email: 'priya@example.com' });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(friendsApi.create).toHaveBeenCalledWith({
            name: 'Priya Sharma',
            email: 'priya@example.com',
        });
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['users', 'friends'] });
    });

    it('blocks creation when a friend already exists with the same email', async () => {
        const existing: User = {
            id: 'friend-1',
            name: 'Priya Sharma',
            email: 'priya@example.com',
        };
        vi.mocked(friendsApi.getAll).mockResolvedValue([existing]);

        const { result } = renderCreateFriend();

        result.current.mutate({ name: 'Someone Else', email: 'priya@example.com' });

        await waitFor(() => expect(result.current.isError).toBe(true));

        expect(result.current.error).toBeInstanceOf(DuplicateFriendError);
        expect(friendsApi.create).not.toHaveBeenCalled();
    });

    it('blocks creation when a friend already exists with the same phone number', async () => {
        const existing: User = {
            id: 'friend-1',
            name: 'Priya Sharma',
            phone: '5551234567',
        };
        vi.mocked(friendsApi.getAll).mockResolvedValue([existing]);

        const { result } = renderCreateFriend();

        result.current.mutate({ name: 'Someone Else', phone: '5551234567' });

        await waitFor(() => expect(result.current.isError).toBe(true));

        expect(result.current.error).toBeInstanceOf(DuplicateFriendError);
        expect(friendsApi.create).not.toHaveBeenCalled();
    });

    it('surfaces a server-side conflict as a DuplicateFriendError', async () => {
        vi.mocked(friendsApi.getAll).mockResolvedValue([]);
        vi.mocked(friendsApi.create).mockRejectedValue(
            new ApiError('CONFLICT', 'A user with this email already exists', 409),
        );

        const { result } = renderCreateFriend();

        result.current.mutate({ name: 'Priya Sharma', email: 'priya@example.com' });

        await waitFor(() => expect(result.current.isError).toBe(true));

        expect(result.current.error).toBeInstanceOf(DuplicateFriendError);
    });
});
