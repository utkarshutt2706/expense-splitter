import { useEffect } from 'react';

import { useIsDarkTheme } from '../useIsDarkTheme';

// Writes the *effective* theme, never the raw preference: 'system' is resolved
// to light/dark here (useIsDarkTheme keeps that in sync with the OS) so the
// attribute is always present and always states what is actually on screen.
//
// That invariant is what lets the dark: variant in index.css be a single
// attribute selector instead of an attribute selector plus a duplicate
// prefers-color-scheme branch. The token blocks in index.css keep their media
// query regardless, because it is what paints the first frame correctly in the
// moment before this effect runs.
export function useThemeAttribute() {
    const isDark = useIsDarkTheme();

    useEffect(() => {
        document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
    }, [isDark]);
}
