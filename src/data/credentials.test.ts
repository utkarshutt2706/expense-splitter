import { describe, expect, it } from 'vitest';

import { findUserIdForCredentials } from './credentials';
import { CURRENT_USER_ID } from './seed';

describe('findUserIdForCredentials', () => {
    it('returns the matching userId for correct credentials', () => {
        expect(findUserIdForCredentials('utkarsh', 'changeme-utkarsh')).toBe(CURRENT_USER_ID);
    });

    it('is case-insensitive and trims whitespace on the username', () => {
        expect(findUserIdForCredentials('  Utkarsh  ', 'changeme-utkarsh')).toBe(CURRENT_USER_ID);
    });

    it('is case-sensitive on the password', () => {
        expect(findUserIdForCredentials('utkarsh', 'Changeme-Utkarsh')).toBeUndefined();
    });

    it('returns undefined for an unknown username', () => {
        expect(findUserIdForCredentials('nobody', 'anything')).toBeUndefined();
    });

    it('returns undefined for a known username with the wrong password', () => {
        expect(findUserIdForCredentials('utkarsh', 'wrong-password')).toBeUndefined();
    });
});
