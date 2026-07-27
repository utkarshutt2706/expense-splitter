import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import type { Group } from '@data/entities';
import { useGroup } from './useGroup';

vi.mock('@services/instances', () => ({
    groupService: {
        getById: vi.fn(),
    },
}));

describe('useGroup', () => {
    it('returns the group with the given id', async () => {
        const { groupService } = await import('@services/instances');
        const group: Group = {
            id: 'group-1',
            name: 'Weekend Trip',
            memberIds: ['current-user', 'friend-1'],
            createdAt: '2026-07-01T00:00:00.000Z',
        };
        vi.mocked(groupService.getById).mockResolvedValue(group);

        const queryClient = new QueryClient();
        const wrapper = ({ children }: { children: ReactNode }) => (
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        );

        const { result } = renderHook(() => useGroup('group-1'), { wrapper });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data).toEqual(group);
        expect(groupService.getById).toHaveBeenCalledWith('group-1');
    });
});
