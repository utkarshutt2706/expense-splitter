import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { User } from '@data/entities';

interface AuthState {
    currentUserId: string | null;
    cachedUser: User | null;
    login: (userId: string) => void;
    logout: () => void;
    setCachedUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            currentUserId: null,
            cachedUser: null,
            login: (userId) => set({ currentUserId: userId }),
            logout: () => set({ currentUserId: null, cachedUser: null }),
            setCachedUser: (user) => set({ cachedUser: user }),
        }),
        { name: 'auth' },
    ),
);
