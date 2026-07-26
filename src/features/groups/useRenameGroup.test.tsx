import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { Group } from '../../lib/storage/models';
import { useRenameGroup } from './useRenameGroup';

vi.mock('../../lib/services', () => ({
    groupService: {
        update: vi.fn(),
    },
}));

describe('useRenameGroup', () => {
    it('renames a group by id and invalidates the groups queries', async () => {
        const { groupService } = await import('../../lib/services');
        const updated: Group = {
            id: 'group-1',
            name: 'Ski Trip',
            memberIds: ['current-user'],
            createdAt: '2026-07-01T00:00:00.000Z',
        };
        vi.mocked(groupService.update).mockResolvedValue(updated);

        const queryClient = new QueryClient();
        const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
        const wrapper = ({ children }: { children: ReactNode }) => (
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        );

        const { result } = renderHook(() => useRenameGroup(), { wrapper });

        result.current.mutate({ id: 'group-1', name: 'Ski Trip' });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(groupService.update).toHaveBeenCalledWith('group-1', { name: 'Ski Trip' });
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['groups'] });
    });
});
