import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import type { User } from '@data/entities';
import { CURRENT_USER_ID } from '@data/seed';
import { useFriends } from './useFriends';

vi.mock('@services/instances', () => ({
    userService: {
        getAll: vi.fn(),
    },
}));

describe('useFriends', () => {
    it('excludes the current user from the friends list', async () => {
        const { userService } = await import('@services/instances');
        const users: User[] = [
            { id: CURRENT_USER_ID, name: 'Alex Morgan', email: 'alex@example.com' },
            { id: 'friend-1', name: 'Priya Sharma', email: 'priya@example.com' },
            { id: 'friend-2', name: 'Jordan Lee', email: 'jordan@example.com' },
        ];
        vi.mocked(userService.getAll).mockResolvedValue(users);

        const queryClient = new QueryClient();
        const wrapper = ({ children }: { children: ReactNode }) => (
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        );

        const { result } = renderHook(() => useFriends(), { wrapper });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data).toEqual([users[1], users[2]]);
    });
});
