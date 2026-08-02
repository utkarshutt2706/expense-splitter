import { create } from 'zustand';

export type ThemeTransitionDirection = 'light' | 'dark';

interface ThemeTransitionState {
    direction: ThemeTransitionDirection | null;
    trigger: (direction: ThemeTransitionDirection) => void;
    clear: () => void;
}

// Deliberately not persisted (unlike themeStore) — this only coordinates a
// one-off, few-seconds-long animation between wherever the toggle lives
// (ThemeToggleRow, inside a portaled Popover) and the full-screen overlay
// mounted in AppLayout; there's nothing here worth surviving a reload.
export const useThemeTransitionStore = create<ThemeTransitionState>((set) => ({
    direction: null,
    trigger: (direction) => set({ direction }),
    clear: () => set({ direction: null }),
}));
