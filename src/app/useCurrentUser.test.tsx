import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { User } from '../lib/storage/models';
import { CURRENT_USER_ID } from '../lib/storage/seed';
import { useCurrentUser } from './useCurrentUser';

vi.mock('../lib/services', () => ({
    userService: {
        getById: vi.fn(),
    },
}));

describe('useCurrentUser', () => {
    it('fetches the user matching CURRENT_USER_ID', async () => {
        const { userService } = await import('../lib/services');
        const user: User = { id: CURRENT_USER_ID, name: 'Alex Morgan', email: 'alex@example.com' };
        vi.mocked(userService.getById).mockResolvedValue(user);

        const queryClient = new QueryClient();
        const wrapper = ({ children }: { children: ReactNode }) => (
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        );

        const { result } = renderHook(() => useCurrentUser(), { wrapper });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(userService.getById).toHaveBeenCalledWith(CURRENT_USER_ID);
        expect(result.current.data).toEqual(user);
    });
});
