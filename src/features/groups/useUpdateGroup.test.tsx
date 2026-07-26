import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { Group } from '../../lib/storage/models';
import { CURRENT_USER_ID } from '../../lib/storage/seed';
import { useUpdateGroup } from './useUpdateGroup';

vi.mock('../../lib/services', () => ({
    groupService: {
        update: vi.fn(),
    },
}));

describe('useUpdateGroup', () => {
    it('updates a group by id, including the current user in the members', async () => {
        const { groupService } = await import('../../lib/services');
        const updated: Group = {
            id: 'group-1',
            name: 'Weekend Trip',
            memberIds: [CURRENT_USER_ID, 'friend-1'],
            createdAt: '2026-07-01T00:00:00.000Z',
        };
        vi.mocked(groupService.update).mockResolvedValue(updated);

        const queryClient = new QueryClient();
        const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
        const wrapper = ({ children }: { children: ReactNode }) => (
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        );

        const { result } = renderHook(() => useUpdateGroup(), { wrapper });

        result.current.mutate({ id: 'group-1', name: 'Weekend Trip', memberIds: ['friend-1'] });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(groupService.update).toHaveBeenCalledWith('group-1', {
            name: 'Weekend Trip',
            memberIds: [CURRENT_USER_ID, 'friend-1'],
        });
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['groups'] });
    });
});
