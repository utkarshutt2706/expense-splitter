import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { useAuthStore } from '@app/stores';
import type { User } from '@features/users/api/usersApi';
import { useCurrentUser } from './useCurrentUser';

describe('useCurrentUser', () => {
    beforeEach(() => {
        localStorage.clear();
        useAuthStore.setState({ currentUserId: null, cachedUser: null });
    });

    it('returns undefined data when no user is cached', () => {
        const { result } = renderHook(() => useCurrentUser());

        expect(result.current.data).toBeUndefined();
    });

    it('returns the cached user from authStore without fetching', () => {
        const cachedUser: User = {
            id: 'current-user',
            name: 'Alex Morgan',
            email: 'alex@example.com',
        };
        useAuthStore.setState({ cachedUser });

        const { result } = renderHook(() => useCurrentUser());

        expect(result.current.data).toEqual(cachedUser);
    });

    it('reacts when the cached user changes', () => {
        const { result } = renderHook(() => useCurrentUser());
        const cachedUser: User = {
            id: 'current-user',
            name: 'Alex Morgan',
            email: 'alex@example.com',
        };

        act(() => useAuthStore.setState({ cachedUser }));

        expect(result.current.data).toBe(cachedUser);
    });
});
