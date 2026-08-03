import { describe, expect, it } from 'vitest';

import { sanitizePhoneInput } from './phone';

describe('sanitizePhoneInput', () => {
    it('strips non-digit characters', () => {
        expect(sanitizePhoneInput('98-7654 3210')).toBe('9876543210');
    });

    it('caps the result at 10 digits', () => {
        expect(sanitizePhoneInput('987654321099')).toBe('9876543210');
    });

    it('returns an empty string unchanged', () => {
        expect(sanitizePhoneInput('')).toBe('');
    });
});
