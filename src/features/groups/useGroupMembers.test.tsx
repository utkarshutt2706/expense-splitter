import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { User } from '../../lib/storage/models';
import { useGroupMembers } from './useGroupMembers';

vi.mock('../../lib/services', () => ({
    userService: {
        getAll: vi.fn(),
    },
}));

describe('useGroupMembers', () => {
    it('resolves member ids to user records, preserving order', async () => {
        const { userService } = await import('../../lib/services');
        const users: User[] = [
            { id: 'current-user', name: 'Alex Morgan', email: 'alex@example.com' },
            { id: 'friend-1', name: 'Priya Sharma', email: 'priya@example.com' },
            { id: 'friend-2', name: 'Jordan Lee', phone: '5551234567' },
        ];
        vi.mocked(userService.getAll).mockResolvedValue(users);

        const queryClient = new QueryClient();
        const wrapper = ({ children }: { children: ReactNode }) => (
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        );

        const { result } = renderHook(() => useGroupMembers(['friend-2', 'current-user']), {
            wrapper,
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data).toEqual([users[2], users[0]]);
    });

    it('skips ids that no longer resolve to a user', async () => {
        const { userService } = await import('../../lib/services');
        vi.mocked(userService.getAll).mockResolvedValue([]);

        const queryClient = new QueryClient();
        const wrapper = ({ children }: { children: ReactNode }) => (
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        );

        const { result } = renderHook(() => useGroupMembers(['missing-user']), { wrapper });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data).toEqual([]);
    });
});
