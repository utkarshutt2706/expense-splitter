import { useQuery } from '@tanstack/react-query';

import { getDashboard, type DashboardDateRange } from '@features/dashboard/api/dashboardApi';

export function useDashboard(range?: DashboardDateRange) {
    return useQuery({
        queryKey: ['dashboard', range?.from ?? 'all-time', range?.to ?? 'all-time'],
        queryFn: () => getDashboard(range),
    });
}
