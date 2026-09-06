import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import * as dashboardApi from '@features/dashboard/api/dashboardApi';
import { useDashboard } from './useDashboard';

vi.mock('@features/dashboard/api/dashboardApi', () => ({ getDashboard: vi.fn() }));

describe('useDashboard', () => {
    it('loads dashboard data', async () => {
        const dashboard = {
            actualPaid: 200,
            currentUserShare: 80,
            memberShares: [],
            groupSpend: [],
        };
        vi.mocked(dashboardApi.getDashboard).mockResolvedValue(dashboard);
        const queryClient = new QueryClient();
        const wrapper = ({ children }: { children: ReactNode }) => (
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        );

        const range = {
            from: '2026-08-01T00:00:00.000Z',
            to: '2026-09-01T00:00:00.000Z',
        };
        const { result } = renderHook(() => useDashboard(range), { wrapper });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data).toEqual(dashboard);
        expect(dashboardApi.getDashboard).toHaveBeenCalledWith(range);
    });

    it('loads the unbounded dashboard when no range is supplied', async () => {
        vi.mocked(dashboardApi.getDashboard).mockResolvedValue({
            actualPaid: 0,
            currentUserShare: 0,
            groupSpend: [],
        });
        const queryClient = new QueryClient();
        const wrapper = ({ children }: { children: ReactNode }) => (
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        );

        const { result } = renderHook(() => useDashboard(), { wrapper });
        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(dashboardApi.getDashboard).toHaveBeenCalledWith(undefined);
    });

    it('exposes dashboard API failures through the query state', async () => {
        const error = new Error('Dashboard unavailable');
        vi.mocked(dashboardApi.getDashboard).mockRejectedValue(error);
        const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
        const wrapper = ({ children }: { children: ReactNode }) => (
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        );

        const { result } = renderHook(() => useDashboard(), { wrapper });
        await waitFor(() => expect(result.current.isError).toBe(true));

        expect(result.current.error).toBe(error);
    });
});
