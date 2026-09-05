import { describe, expect, it } from 'vitest';

import { cn } from './cn';

describe('cn', () => {
    it('joins plain class strings', () => {
        expect(cn('animate-pulse', 'bg-muted')).toBe('animate-pulse bg-muted');
    });

    it('lets a later conflicting Tailwind utility win, regardless of Tailwind’s own rule order', () => {
        expect(cn('rounded-md', 'rounded-full')).toBe('rounded-full');
    });

    it('drops falsy values', () => {
        expect(cn('h-4', undefined, false, '', 'w-20')).toBe('h-4 w-20');
    });

    it('supports conditional objects and nested class arrays', () => {
        expect(cn(['flex', ['items-center']], { hidden: false, block: true })).toBe(
            'items-center block',
        );
    });

    it('returns an empty string when no classes are supplied', () => {
        expect(cn()).toBe('');
    });
});
