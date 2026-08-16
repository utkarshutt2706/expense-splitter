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
            memberShares: [],
            groupSpend: [],
        };
        vi.mocked(httpClient.get).mockResolvedValue({ data: dashboard });

        await expect(getDashboard()).resolves.toEqual(dashboard);
        expect(httpClient.get).toHaveBeenCalledWith('/dashboard');
    });
});
