import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { GroupSummary } from '@features/groups/api/groupsApi';
import * as groupsApi from '@features/groups/api/groupsApi';

import { useGroupSummaries } from './useGroupSummaries';

vi.mock('@features/groups/api/groupsApi', () => ({ getAllSummaries: vi.fn() }));

function queryWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    return {
        queryClient,
        wrapper: ({ children }: { children: ReactNode }) => (
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
    };
}

describe('useGroupSummaries', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('loads group summaries under the summaries query key', async () => {
        const groups = [
            {
                id: 'group-1',
                name: 'Weekend Trip',
                memberIds: ['current', 'friend'],
                memberCount: 2,
                currentUserBalance: 10,
                hasFinancialActivity: true,
                lastActivityAt: '2026-08-01T00:00:00.000Z',
                createdAt: '2026-07-01T00:00:00.000Z',
            },
        ] satisfies GroupSummary[];
        vi.mocked(groupsApi.getAllSummaries).mockResolvedValue(groups);
        const { wrapper, queryClient } = queryWrapper();

        const { result } = renderHook(() => useGroupSummaries(), { wrapper });
        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(groupsApi.getAllSummaries).toHaveBeenCalledOnce();
        expect(result.current.data).toEqual(groups);
        expect(queryClient.getQueryData(['groups', 'summaries'])).toEqual(groups);
    });

    it('exposes API failures through the query result', async () => {
        const error = new Error('Unable to load groups');
        vi.mocked(groupsApi.getAllSummaries).mockRejectedValue(error);
        const { wrapper } = queryWrapper();

        const { result } = renderHook(() => useGroupSummaries(), { wrapper });
        await waitFor(() => expect(result.current.isError).toBe(true));

        expect(result.current.error).toBe(error);
        expect(groupsApi.getAllSummaries).toHaveBeenCalledOnce();
    });
});
