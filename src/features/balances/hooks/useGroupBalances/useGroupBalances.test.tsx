import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import * as balancesApi from '@features/balances/api/balancesApi';
import type { GroupBalances } from '@features/balances/api/balancesApi';
import { useGroupBalances } from './useGroupBalances';

vi.mock('@features/balances/api/balancesApi', () => ({
    getByGroupId: vi.fn(),
}));

function renderUseGroupBalances(groupId: string) {
    const queryClient = new QueryClient();
    const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    return renderHook(() => useGroupBalances(groupId), { wrapper });
}

describe('useGroupBalances', () => {
    it('fetches balances and settlements for the given group', async () => {
        const groupBalances: GroupBalances = {
            balances: [{ userId: 'current-user', balance: -20 }],
            settlements: [{ fromUserId: 'current-user', toUserId: 'friend-1', amount: 20 }],
        };
        vi.mocked(balancesApi.getByGroupId).mockResolvedValue(groupBalances);

        const { result } = renderUseGroupBalances('group-1');

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(balancesApi.getByGroupId).toHaveBeenCalledWith('group-1');
        expect(result.current.data).toEqual(groupBalances);
    });

    it('does not fetch when the group id is empty', () => {
        const { result } = renderUseGroupBalances('');

        expect(result.current.fetchStatus).toBe('idle');
    });
});
