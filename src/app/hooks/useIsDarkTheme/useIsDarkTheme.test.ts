import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useThemeStore } from '@app/stores';
import { useIsDarkTheme } from './useIsDarkTheme';

function mockSystemPrefersDark(matches: boolean) {
    vi.spyOn(window, 'matchMedia').mockReturnValue({
        matches,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
    } as unknown as MediaQueryList);
}

describe('useIsDarkTheme', () => {
    beforeEach(() => {
        useThemeStore.setState({ theme: 'system' });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('returns true when the preference is explicitly dark', () => {
        useThemeStore.setState({ theme: 'dark' });

        const { result } = renderHook(() => useIsDarkTheme());

        expect(result.current).toBe(true);
    });

    it('returns false when the preference is explicitly light', () => {
        useThemeStore.setState({ theme: 'light' });

        const { result } = renderHook(() => useIsDarkTheme());

        expect(result.current).toBe(false);
    });

    it('falls back to the system preference when set to system and the OS prefers dark', () => {
        mockSystemPrefersDark(true);
        useThemeStore.setState({ theme: 'system' });

        const { result } = renderHook(() => useIsDarkTheme());

        expect(result.current).toBe(true);
    });

    it('falls back to the system preference when set to system and the OS prefers light', () => {
        mockSystemPrefersDark(false);
        useThemeStore.setState({ theme: 'system' });

        const { result } = renderHook(() => useIsDarkTheme());

        expect(result.current).toBe(false);
    });
});
