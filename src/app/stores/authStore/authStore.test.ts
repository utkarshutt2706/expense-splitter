import { beforeEach, describe, expect, it } from 'vitest';

import type { User } from '@data/entities';
import { useAuthStore } from './authStore';

const user: User = { id: 'current-user', name: 'Alex Morgan', email: 'alex@example.com' };

describe('useAuthStore', () => {
    beforeEach(() => {
        localStorage.clear();
        useAuthStore.setState({ currentUserId: null, cachedUser: null });
    });

    it('defaults to no logged-in user and no cached user', () => {
        expect(useAuthStore.getState().currentUserId).toBeNull();
        expect(useAuthStore.getState().cachedUser).toBeNull();
    });

    it('sets the current user on login', () => {
        useAuthStore.getState().login('current-user');

        expect(useAuthStore.getState().currentUserId).toBe('current-user');
    });

    it('clears the current user on logout', () => {
        useAuthStore.getState().login('current-user');
        useAuthStore.getState().logout();

        expect(useAuthStore.getState().currentUserId).toBeNull();
    });

    it('caches a user via setCachedUser', () => {
        useAuthStore.getState().setCachedUser(user);

        expect(useAuthStore.getState().cachedUser).toEqual(user);
    });

    it('clears the cached user on logout', () => {
        useAuthStore.getState().login('current-user');
        useAuthStore.getState().setCachedUser(user);

        useAuthStore.getState().logout();

        expect(useAuthStore.getState().cachedUser).toBeNull();
    });

    it('persists the logged-in and cached user to local storage', () => {
        useAuthStore.getState().login('current-user');
        useAuthStore.getState().setCachedUser(user);

        const stored = JSON.parse(localStorage.getItem('auth')!) as {
            state: { currentUserId: string; cachedUser: User };
        };
        expect(stored.state.currentUserId).toBe('current-user');
        expect(stored.state.cachedUser).toEqual(user);
    });
});
