import { create } from 'zustand';

import type { User } from '@features/users/api/usersApi';

const LEGACY_AUTH_STORAGE_KEY = 'auth';

// Authentication used to be persisted by Zustand. Remove that browser-readable
// bearer token when users load a version containing the memory-only store.
try {
    globalThis.localStorage?.removeItem(LEGACY_AUTH_STORAGE_KEY);
} catch {
    // Storage can be unavailable in privacy-restricted browser contexts.
}

interface AuthState {
    currentUserId: string | null;
    cachedUser: User | null;
    accessToken: string | null;
    login: (user: User, accessToken: string) => void;
    updateCachedUser: (user: Partial<User>) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
    currentUserId: null,
    cachedUser: null,
    accessToken: null,
    login: (user, accessToken) => set({ currentUserId: user.id, cachedUser: user, accessToken }),
    updateCachedUser: (patch) => {
        const current = get().cachedUser;
        if (!current) return;
        set({ cachedUser: { ...current, ...patch } });
    },
    logout: () => set({ currentUserId: null, cachedUser: null, accessToken: null }),
}));
