import { useSyncExternalStore } from 'react';

import { useThemeStore } from '@app/stores';

const DARK_QUERY = '(prefers-color-scheme: dark)';

function subscribeToSystemPreference(onChange: () => void) {
    const mediaQuery = window.matchMedia(DARK_QUERY);
    mediaQuery.addEventListener('change', onChange);
    return () => mediaQuery.removeEventListener('change', onChange);
}

function getSystemPrefersDark() {
    return window.matchMedia(DARK_QUERY).matches;
}

// Resolves the theme store's preference to an actual light/dark boolean —
// 'system' isn't renderable on its own, it needs the OS preference looked up,
// and useSyncExternalStore keeps that reactive if the OS preference changes
// while 'system' is selected (matching how useThemeAttribute lets the
// prefers-color-scheme media query in index.css drive the same case).
export function useIsDarkTheme(): boolean {
    const theme = useThemeStore((state) => state.theme);
    const systemPrefersDark = useSyncExternalStore(
        subscribeToSystemPreference,
        getSystemPrefersDark,
    );

    if (theme === 'system') return systemPrefersDark;
    return theme === 'dark';
}
