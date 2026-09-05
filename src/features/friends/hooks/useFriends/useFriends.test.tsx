import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { User } from '@features/users/api/usersApi';
import { CURRENT_USER_ID } from '@test/fixtures/ids';
import * as friendsApi from '@features/friends/api/friendsApi';
import { useFriends } from './useFriends';

vi.mock('@features/friends/api/friendsApi', () => ({
    getFriends: vi.fn(),
}));

vi.mock('@app/hooks', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@app/hooks')>()),
    useCurrentUser: () => ({
        data: { id: CURRENT_USER_ID, name: 'Alex Morgan', email: 'alex@example.com' },
    }),
}));

describe('useFriends', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('returns the derived friend list as-is from the server', async () => {
        const users: User[] = [
            { id: 'friend-1', name: 'Priya Sharma', email: 'priya@example.com' },
            { id: 'friend-2', name: 'Jordan Lee', email: 'jordan@example.com' },
        ];
        vi.mocked(friendsApi.getFriends).mockResolvedValue(users);

        const queryClient = new QueryClient();
        const wrapper = ({ children }: { children: ReactNode }) => (
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        );

        const { result } = renderHook(() => useFriends(), { wrapper });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data).toEqual(users);
        expect(friendsApi.getFriends).toHaveBeenCalledOnce();
        expect(queryClient.getQueryData(['users', 'friends', CURRENT_USER_ID])).toEqual(users);
    });

    it('exposes API failures without retrying', async () => {
        const failure = new Error('Unable to load friends');
        vi.mocked(friendsApi.getFriends).mockRejectedValue(failure);
        const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
        const wrapper = ({ children }: { children: ReactNode }) => (
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        );

        const { result } = renderHook(() => useFriends(), { wrapper });

        await waitFor(() => expect(result.current.isError).toBe(true));
        expect(result.current.error).toBe(failure);
        expect(friendsApi.getFriends).toHaveBeenCalledOnce();
    });
});
