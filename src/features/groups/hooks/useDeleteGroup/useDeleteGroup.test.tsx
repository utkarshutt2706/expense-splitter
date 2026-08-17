import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import * as groupsApi from '@features/groups/api/groupsApi';
import { useDeleteGroup } from './useDeleteGroup';

vi.mock('@features/groups/api/groupsApi', () => ({
    remove: vi.fn(),
}));

describe('useDeleteGroup', () => {
    it('deletes the group and invalidates the groups list', async () => {
        vi.mocked(groupsApi.remove).mockResolvedValue(undefined);

        const queryClient = new QueryClient();
        const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
        const wrapper = ({ children }: { children: ReactNode }) => (
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        );

        const { result } = renderHook(() => useDeleteGroup(), { wrapper });

        result.current.mutate('group-1');

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(groupsApi.remove).toHaveBeenCalledWith('group-1');
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['groups'] });
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['users', 'friends'] });
    });
});
