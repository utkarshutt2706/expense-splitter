import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { User } from '../../lib/storage/models';
import { useUpdateFriend } from './useUpdateFriend';

vi.mock('../../lib/services', () => ({
    userService: {
        update: vi.fn(),
    },
}));

describe('useUpdateFriend', () => {
    it('updates a user by id and invalidates the friends list', async () => {
        const { userService } = await import('../../lib/services');
        const updated: User = {
            id: 'friend-1',
            name: 'Priya S.',
            email: 'priya@example.com',
        };
        vi.mocked(userService.update).mockResolvedValue(updated);

        const queryClient = new QueryClient();
        const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
        const wrapper = ({ children }: { children: ReactNode }) => (
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        );

        const { result } = renderHook(() => useUpdateFriend(), { wrapper });

        result.current.mutate({ id: 'friend-1', name: 'Priya S.', email: 'priya@example.com' });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(userService.update).toHaveBeenCalledWith('friend-1', {
            name: 'Priya S.',
            email: 'priya@example.com',
        });
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['users', 'friends'] });
    });
});
