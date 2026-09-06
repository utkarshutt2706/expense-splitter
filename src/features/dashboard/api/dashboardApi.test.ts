import { describe, expect, it, vi } from 'vitest';

import { httpClient } from '@lib/api/httpClient';
import { getDashboard, type DashboardSummary } from './dashboardApi';

vi.mock('@lib/api/httpClient', () => ({
    httpClient: { get: vi.fn() },
}));

describe('dashboardApi', () => {
    it('fetches the signed-in user dashboard', async () => {
        const dashboard: DashboardSummary = {
            actualPaid: 200,
            currentUserShare: 80,
            groupSpend: [],
        };
        vi.mocked(httpClient.get).mockResolvedValue({ data: dashboard });

        const range = {
            from: '2026-08-01T00:00:00.000Z',
            to: '2026-09-01T00:00:00.000Z',
        };
        await expect(getDashboard(range)).resolves.toEqual(dashboard);
        expect(httpClient.get).toHaveBeenCalledWith('/dashboard', { params: range });
    });

    it('requests the all-time dashboard without manufacturing query parameters', async () => {
        const dashboard: DashboardSummary = {
            actualPaid: 0,
            currentUserShare: 0,
            groupSpend: [],
        };
        vi.mocked(httpClient.get).mockResolvedValue({ data: dashboard });

        await expect(getDashboard()).resolves.toBe(dashboard);
        expect(httpClient.get).toHaveBeenCalledWith('/dashboard', { params: undefined });
    });

    it('propagates transport failures for the query layer to handle', async () => {
        const error = new Error('Dashboard unavailable');
        vi.mocked(httpClient.get).mockRejectedValue(error);

        await expect(getDashboard()).rejects.toBe(error);
    });
});
