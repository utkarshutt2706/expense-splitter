import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { User } from '@data/entities';

interface AuthState {
    currentUserId: string | null;
    cachedUser: User | null;
    accessToken: string | null;
    login: (user: User, accessToken: string) => void;
    updateCachedUser: (user: Partial<User>) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            currentUserId: null,
            cachedUser: null,
            accessToken: null,
            login: (user, accessToken) =>
                set({ currentUserId: user.id, cachedUser: user, accessToken }),
            updateCachedUser: (patch) => {
                const current = get().cachedUser;
                if (!current) return;
                set({ cachedUser: { ...current, ...patch } });
            },
            logout: () => set({ currentUserId: null, cachedUser: null, accessToken: null }),
        }),
        { name: 'auth' },
    ),
);
