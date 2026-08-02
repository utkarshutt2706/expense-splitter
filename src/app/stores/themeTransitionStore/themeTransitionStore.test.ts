import { beforeEach, describe, expect, it } from 'vitest';

import { useThemeTransitionStore } from './themeTransitionStore';

describe('useThemeTransitionStore', () => {
    beforeEach(() => {
        useThemeTransitionStore.setState({ direction: null });
    });

    it('defaults to no transition in progress', () => {
        expect(useThemeTransitionStore.getState().direction).toBeNull();
    });

    it('sets the direction when triggered', () => {
        useThemeTransitionStore.getState().trigger('dark');

        expect(useThemeTransitionStore.getState().direction).toBe('dark');
    });

    it('clears the direction', () => {
        useThemeTransitionStore.getState().trigger('light');
        useThemeTransitionStore.getState().clear();

        expect(useThemeTransitionStore.getState().direction).toBeNull();
    });
});
