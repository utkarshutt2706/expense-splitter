import { beforeEach, describe, expect, it } from 'vitest';

import { useThemeTransitionStore } from './themeTransitionStore';

describe('useThemeTransitionStore', () => {
    beforeEach(() => {
        localStorage.clear();
        sessionStorage.clear();
        useThemeTransitionStore.setState({ direction: null });
    });

    it('defaults to no transition in progress', () => {
        expect(useThemeTransitionStore.getState().direction).toBeNull();
    });

    it.each(['dark', 'light'] as const)('sets the %s direction when triggered', (direction) => {
        useThemeTransitionStore.getState().trigger(direction);

        expect(useThemeTransitionStore.getState().direction).toBe(direction);
    });

    it('replaces an active transition when another direction is triggered', () => {
        useThemeTransitionStore.getState().trigger('dark');
        useThemeTransitionStore.getState().trigger('light');

        expect(useThemeTransitionStore.getState().direction).toBe('light');
    });

    it('does not persist transient transition state', () => {
        useThemeTransitionStore.getState().trigger('dark');

        expect(localStorage.length).toBe(0);
        expect(sessionStorage.length).toBe(0);
    });

    it('clears the direction', () => {
        useThemeTransitionStore.getState().trigger('light');
        useThemeTransitionStore.getState().clear();

        expect(useThemeTransitionStore.getState().direction).toBeNull();
    });
});
