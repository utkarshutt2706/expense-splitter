import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { User } from '@data/entities';

interface AuthState {
    currentUserId: string | null;
    cachedUser: User | null;
    accessToken: string | null;
    login: (user: User, accessToken: string) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            currentUserId: null,
            cachedUser: null,
            accessToken: null,
            login: (user, accessToken) =>
                set({ currentUserId: user.id, cachedUser: user, accessToken }),
            logout: () => set({ currentUserId: null, cachedUser: null, accessToken: null }),
        }),
        { name: 'auth' },
    ),
);
