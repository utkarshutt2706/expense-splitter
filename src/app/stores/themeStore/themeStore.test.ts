import { beforeEach, describe, expect, it } from 'vitest';

import { useThemeStore } from './themeStore';

describe('useThemeStore', () => {
    beforeEach(() => {
        localStorage.clear();
        useThemeStore.setState({ theme: 'system' });
    });

    it('defaults to the system theme', () => {
        expect(useThemeStore.getState().theme).toBe('system');
    });

    it('updates the theme when setTheme is called', () => {
        useThemeStore.getState().setTheme('dark');

        expect(useThemeStore.getState().theme).toBe('dark');
    });

    it('persists the theme to local storage', () => {
        useThemeStore.getState().setTheme('light');

        const stored = JSON.parse(localStorage.getItem('theme-preference')!) as {
            state: { theme: string };
        };
        expect(stored.state.theme).toBe('light');
    });
});
