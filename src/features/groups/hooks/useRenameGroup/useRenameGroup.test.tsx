import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import type { Group } from '@features/groups/api/groupsApi';
import * as groupsApi from '@features/groups/api/groupsApi';
import { useRenameGroup } from './useRenameGroup';

vi.mock('@features/groups/api/groupsApi', () => ({
    update: vi.fn(),
}));

describe('useRenameGroup', () => {
    it('renames a group via the API and invalidates the groups queries', async () => {
        const updated: Group = {
            id: 'group-1',
            name: 'Ski Trip',
            memberIds: ['current-user'],
            createdAt: '2026-07-01T00:00:00.000Z',
        };
        vi.mocked(groupsApi.update).mockResolvedValue(updated);

        const queryClient = new QueryClient();
        const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
        const wrapper = ({ children }: { children: ReactNode }) => (
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        );

        const { result } = renderHook(() => useRenameGroup(), { wrapper });

        result.current.mutate({ id: 'group-1', name: 'Ski Trip' });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(groupsApi.update).toHaveBeenCalledWith('group-1', { name: 'Ski Trip' });
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['groups'] });
    });

    it('exposes rename failures without invalidating cached groups', async () => {
        const failure = new Error('Rename failed');
        vi.mocked(groupsApi.update).mockRejectedValue(failure);
        const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
        const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
        const wrapper = ({ children }: { children: ReactNode }) => (
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        );
        const { result } = renderHook(() => useRenameGroup(), { wrapper });

        result.current.mutate({ id: 'group-1', name: 'Ski Trip' });

        await waitFor(() => expect(result.current.isError).toBe(true));
        expect(result.current.error).toBe(failure);
        expect(invalidateSpy).not.toHaveBeenCalled();
    });
});
