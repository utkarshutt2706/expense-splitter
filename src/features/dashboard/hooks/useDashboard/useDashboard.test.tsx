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

        const { result } = renderHook(useDashboard, { wrapper });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data).toEqual(dashboard);
    });
});
