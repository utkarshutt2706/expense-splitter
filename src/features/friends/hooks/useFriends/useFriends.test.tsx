import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import type { User } from '@data/entities';
import { CURRENT_USER_ID } from '@data/seed';
import * as friendsApi from '@features/friends/api/friendsApi';
import { useFriends } from './useFriends';

vi.mock('@features/friends/api/friendsApi', () => ({
    getAll: vi.fn(),
}));

vi.mock('@app/hooks', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@app/hooks')>()),
    useCurrentUser: () => ({
        data: { id: CURRENT_USER_ID, name: 'Alex Morgan', email: 'alex@example.com' },
    }),
}));

describe('useFriends', () => {
    it('excludes the current user from the friends list', async () => {
        const users: User[] = [
            { id: CURRENT_USER_ID, name: 'Alex Morgan', email: 'alex@example.com' },
            { id: 'friend-1', name: 'Priya Sharma', email: 'priya@example.com' },
            { id: 'friend-2', name: 'Jordan Lee', email: 'jordan@example.com' },
        ];
        vi.mocked(friendsApi.getAll).mockResolvedValue(users);

        const queryClient = new QueryClient();
        const wrapper = ({ children }: { children: ReactNode }) => (
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        );

        const { result } = renderHook(() => useFriends(), { wrapper });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data).toEqual([users[1], users[2]]);
    });
});
