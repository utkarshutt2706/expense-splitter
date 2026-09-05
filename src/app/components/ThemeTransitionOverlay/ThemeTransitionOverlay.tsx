import { Moon, Sun } from 'lucide-react';

import { useThemeTransitionStore } from '@app/stores';

// A brief, full-screen, translucent Sun/Moon "rise" over the current page
// whenever the theme is toggled (ThemeToggleRow triggers it; this just renders
// it). Mounted once in AppLayout rather than inside the popover the toggle
// lives in, since a Radix Popover's own stacking context can't cover the whole
// viewport the way this needs to. Not rendered at all outside a transition —
// this is a one-off effect, not a persistent overlay.
export function ThemeTransitionOverlay() {
    const direction = useThemeTransitionStore((state) => state.direction);
    const clear = useThemeTransitionStore((state) => state.clear);

    if (!direction) return null;

    const isDark = direction === 'dark';

    return (
        <div
            aria-hidden="true"
            onAnimationEnd={(event) => {
                if (event.target === event.currentTarget) clear();
            }}
            className="animate-theme-backdrop pointer-events-none fixed inset-0 z-9999 flex items-center justify-center"
        >
            {isDark ? (
                <Moon className="animate-theme-icon size-32 text-slate-100 drop-shadow-lg md:size-48" />
            ) : (
                <Sun className="animate-theme-icon text-brand-500 size-32 drop-shadow-lg md:size-48" />
            )}
        </div>
    );
}
