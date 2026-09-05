import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useThemeStore } from './themeStore';

describe('useThemeStore', () => {
    beforeEach(() => {
        localStorage.clear();
        useThemeStore.setState({ theme: 'system' });
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it('defaults to the system theme in a fresh store', async () => {
        localStorage.clear();
        vi.resetModules();

        const { useThemeStore: freshStore } = await import('./themeStore');

        expect(freshStore.getState().theme).toBe('system');
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

    it('hydrates a persisted theme in a fresh store', async () => {
        localStorage.setItem(
            'theme-preference',
            JSON.stringify({ state: { theme: 'dark' }, version: 0 }),
        );
        vi.resetModules();

        const { useThemeStore: freshStore } = await import('./themeStore');

        expect(freshStore.getState().theme).toBe('dark');
    });

    it('falls back to system when persisted theme data is invalid', async () => {
        localStorage.setItem(
            'theme-preference',
            JSON.stringify({ state: { theme: 'sepia' }, version: 0 }),
        );
        vi.resetModules();

        const { useThemeStore: freshStore } = await import('./themeStore');

        expect(freshStore.getState().theme).toBe('system');
    });

    it('keeps theme updates usable when storage reads and writes are blocked', async () => {
        vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
            throw new Error('storage blocked');
        });
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new Error('storage blocked');
        });
        vi.resetModules();
        const { useThemeStore: freshStore } = await import('./themeStore');

        freshStore.getState().setTheme('dark');

        expect(freshStore.getState().theme).toBe('dark');
    });

    it('clears persisted state without failing when storage removal is blocked', async () => {
        vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
            throw new Error('storage blocked');
        });
        vi.resetModules();
        const { useThemeStore: freshStore } = await import('./themeStore');

        expect(() => freshStore.persist.clearStorage()).not.toThrow();
    });

    it('works in memory when local storage is unavailable', async () => {
        vi.stubGlobal('localStorage', undefined);
        vi.resetModules();
        const { useThemeStore: freshStore } = await import('./themeStore');

        freshStore.getState().setTheme('light');
        await freshStore.persist.clearStorage();

        expect(freshStore.getState().theme).toBe('light');
    });
});
