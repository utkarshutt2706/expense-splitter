import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { User } from '@data/entities';
import { CURRENT_USER_ID } from '@data/seed';
import { useCurrentUser } from './useCurrentUser';

vi.mock('@services/instances', () => ({
    userService: {
        getById: vi.fn(),
    },
}));

function renderCurrentUser() {
    const queryClient = new QueryClient();
    const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    return renderHook(() => useCurrentUser(), { wrapper });
}

describe('useCurrentUser', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('fetches the user matching CURRENT_USER_ID', async () => {
        const { userService } = await import('@services/instances');
        const user: User = { id: CURRENT_USER_ID, name: 'Alex Morgan', email: 'alex@example.com' };
        vi.mocked(userService.getById).mockResolvedValue(user);

        const { result } = renderCurrentUser();

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(userService.getById).toHaveBeenCalledWith(CURRENT_USER_ID);
        expect(result.current.data).toEqual(user);
    });

    it('renders the locally cached user immediately, before the fetch resolves', async () => {
        const { userService } = await import('@services/instances');
        const cachedUser: User = {
            id: CURRENT_USER_ID,
            name: 'Cached Name',
            email: 'cached@example.com',
        };
        localStorage.setItem('current-user', JSON.stringify(cachedUser));
        vi.mocked(userService.getById).mockResolvedValue({
            ...cachedUser,
            name: 'Fresh Name',
        });

        const { result } = renderCurrentUser();

        expect(result.current.data).toEqual(cachedUser);
        expect(result.current.isLoading).toBe(false);

        await waitFor(() => expect(result.current.data?.name).toBe('Fresh Name'));
    });

    it('falls back to fetching normally when the cached value is corrupted', async () => {
        const { userService } = await import('@services/instances');
        const user: User = { id: CURRENT_USER_ID, name: 'Alex Morgan', email: 'alex@example.com' };
        localStorage.setItem('current-user', 'not json');
        vi.mocked(userService.getById).mockResolvedValue(user);

        const { result } = renderCurrentUser();

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data).toEqual(user);
    });

    it('caches the fetched user locally once the request resolves', async () => {
        const { userService } = await import('@services/instances');
        const user: User = { id: CURRENT_USER_ID, name: 'Alex Morgan', email: 'alex@example.com' };
        vi.mocked(userService.getById).mockResolvedValue(user);

        const { result } = renderCurrentUser();

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(JSON.parse(localStorage.getItem('current-user')!)).toEqual(user);
    });
});
