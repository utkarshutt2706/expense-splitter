import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useThemeStore } from '../stores/themeStore';
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

    it('clears the attribute when the preference is system', () => {
        useThemeStore.setState({ theme: 'dark' });
        renderHook(() => useThemeAttribute());

        act(() => {
            useThemeStore.getState().setTheme('system');
        });

        expect(document.documentElement.dataset.theme).toBeUndefined();
    });
});
