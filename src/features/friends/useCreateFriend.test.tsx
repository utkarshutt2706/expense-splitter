import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { User } from '../../lib/storage/models';
import { useCreateFriend } from './useCreateFriend';

vi.mock('../../lib/services', () => ({
    userService: {
        create: vi.fn(),
    },
}));

describe('useCreateFriend', () => {
    it('creates a user with a generated id and invalidates the friends list', async () => {
        const { userService } = await import('../../lib/services');
        const created: User = {
            id: 'generated-id',
            name: 'Priya Sharma',
            email: 'priya@example.com',
        };
        vi.mocked(userService.create).mockResolvedValue(created);

        const queryClient = new QueryClient();
        const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
        const wrapper = ({ children }: { children: ReactNode }) => (
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        );

        const { result } = renderHook(() => useCreateFriend(), { wrapper });

        result.current.mutate({ name: 'Priya Sharma', email: 'priya@example.com' });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(userService.create).toHaveBeenCalledWith(
            expect.objectContaining({ name: 'Priya Sharma', email: 'priya@example.com' }),
        );
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['users', 'friends'] });
    });
});
