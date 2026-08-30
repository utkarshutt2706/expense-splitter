import { beforeEach, describe, expect, it } from 'vitest';

import type { User } from '@data/entities';
import { useAuthStore } from './authStore';

const user: User = { id: 'current-user', name: 'Alex Morgan', email: 'alex@example.com' };
const accessToken = 'test-access-token';

describe('useAuthStore', () => {
    beforeEach(() => {
        localStorage.clear();
        useAuthStore.setState({ currentUserId: null, cachedUser: null, accessToken: null });
    });

    it('defaults to no logged-in user, no cached user, and no access token', () => {
        expect(useAuthStore.getState().currentUserId).toBeNull();
        expect(useAuthStore.getState().cachedUser).toBeNull();
        expect(useAuthStore.getState().accessToken).toBeNull();
    });

    it('sets the current user, cached user, and access token on login', () => {
        useAuthStore.getState().login(user, accessToken);

        expect(useAuthStore.getState().currentUserId).toBe(user.id);
        expect(useAuthStore.getState().cachedUser).toEqual(user);
        expect(useAuthStore.getState().accessToken).toBe(accessToken);
    });

    it('clears the current user, cached user, and access token on logout', () => {
        useAuthStore.getState().login(user, accessToken);
        useAuthStore.getState().logout();

        expect(useAuthStore.getState().currentUserId).toBeNull();
        expect(useAuthStore.getState().cachedUser).toBeNull();
        expect(useAuthStore.getState().accessToken).toBeNull();
    });

    it('keeps the logged-in user and access token out of browser storage', () => {
        useAuthStore.getState().login(user, accessToken);

        expect(localStorage.getItem('auth')).toBeNull();
        expect(sessionStorage.getItem('auth')).toBeNull();
    });

    it('updates the cached user with partial field patches', () => {
        useAuthStore.getState().login(user, accessToken);
        useAuthStore.getState().updateCachedUser({ phone: '9876543210' });

        expect(useAuthStore.getState().cachedUser).toEqual({
            ...user,
            phone: '9876543210',
        });
    });

    it('ignores cached-user patches when no user is currently stored', () => {
        expect(useAuthStore.getState().cachedUser).toBeNull();

        useAuthStore.getState().updateCachedUser({ phone: '9876543210' });

        expect(useAuthStore.getState().cachedUser).toBeNull();
    });
});
