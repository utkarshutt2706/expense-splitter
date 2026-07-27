import { describe, expect, it } from 'vitest';

import { getInitials } from './getInitials';

describe('getInitials', () => {
    it('returns null for an empty string', () => {
        expect(getInitials('')).toBeNull();
    });

    it('returns null for a whitespace-only string', () => {
        expect(getInitials('   ')).toBeNull();
    });

    it('returns the first letter for a single-word name', () => {
        expect(getInitials('Cher')).toBe('C');
    });

    it('combines first and last word initials for a two-word name', () => {
        expect(getInitials('Alex Morgan')).toBe('AM');
    });

    it('ignores middle words for a three-word name', () => {
        expect(getInitials('Alex Jordan Morgan')).toBe('AM');
    });

    it('uppercases initials regardless of input casing', () => {
        expect(getInitials('alex morgan')).toBe('AM');
    });

    it('collapses extra whitespace between words', () => {
        expect(getInitials('  Alex   Morgan  ')).toBe('AM');
    });
});
