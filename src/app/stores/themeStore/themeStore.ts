import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';

export type ThemePreference = 'light' | 'dark' | 'system';
const THEME_PREFERENCES = new Set<ThemePreference>(['light', 'dark', 'system']);

interface ThemeState {
    theme: ThemePreference;
    setTheme: (theme: ThemePreference) => void;
}

const safeThemeStorage: StateStorage = {
    getItem: (name) => {
        try {
            return globalThis.localStorage?.getItem(name) ?? null;
        } catch {
            return null;
        }
    },
    setItem: (name, value) => {
        try {
            globalThis.localStorage?.setItem(name, value);
        } catch {
            // The in-memory preference still works when browser storage is blocked.
        }
    },
    removeItem: (name) => {
        try {
            globalThis.localStorage?.removeItem(name);
        } catch {
            // Clearing an unavailable persistence layer is already satisfied.
        }
    },
};

export const useThemeStore = create<ThemeState>()(
    persist(
        (set) => ({
            theme: 'system',
            setTheme: (theme) => set({ theme }),
        }),
        {
            name: 'theme-preference',
            storage: createJSONStorage(() => safeThemeStorage),
            merge: (persisted, current) => {
                const candidate = (persisted as Partial<ThemeState> | undefined)?.theme;
                const theme = THEME_PREFERENCES.has(candidate as ThemePreference)
                    ? (candidate as ThemePreference)
                    : 'system';
                return { ...current, theme };
            },
        },
    ),
);
