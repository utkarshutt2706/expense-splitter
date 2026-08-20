import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { useThemeStore } from '@app/stores';
import { useThemeAttribute } from './useThemeAttribute';

describe('useThemeAttribute', () => {
    afterEach(() => {
        delete document.documentElement.dataset.theme;
        useThemeStore.setState({ theme: 'system' });
    });

    it('sets the data-theme attribute to the stored preference', () => {
        renderHook(() => useThemeAttribute());

        act(() => {
            useThemeStore.getState().setTheme('dark');
        });

        expect(document.documentElement.dataset.theme).toBe('dark');
    });

    it('keeps writing the attribute for an explicit light preference', () => {
        renderHook(() => useThemeAttribute());

        act(() => {
            useThemeStore.getState().setTheme('light');
        });

        expect(document.documentElement.dataset.theme).toBe('light');
    });

    // The dark: variant in index.css keys off this attribute alone, so it has to
    // be present even on 'system' — resolved to whatever the OS currently is,
    // rather than cleared.
    it('resolves a system preference to a concrete theme instead of clearing it', () => {
        useThemeStore.setState({ theme: 'dark' });
        renderHook(() => useThemeAttribute());

        act(() => {
            useThemeStore.getState().setTheme('system');
        });

        expect(document.documentElement.dataset.theme).toBe('light');
    });
});
