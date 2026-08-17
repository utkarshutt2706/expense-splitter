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
});
