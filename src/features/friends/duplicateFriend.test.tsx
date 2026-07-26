import { describe, expect, it } from 'vitest';
import type { User } from '../../lib/storage/models';
import { findDuplicateFriend } from './duplicateFriend';

const priya: User = { id: 'friend-1', name: 'Priya Sharma', email: 'priya@example.com' };
const jordan: User = { id: 'friend-2', name: 'Jordan Lee', phone: '5551234567' };

describe('findDuplicateFriend', () => {
    it('returns undefined when there is no match', () => {
        expect(findDuplicateFriend([priya, jordan], { email: 'new@example.com' })).toBeUndefined();
    });

    it('matches on email, case-insensitively', () => {
        expect(findDuplicateFriend([priya, jordan], { email: 'PRIYA@example.com' })).toBe(priya);
    });

    it('matches on phone number', () => {
        expect(findDuplicateFriend([priya, jordan], { phone: '5551234567' })).toBe(jordan);
    });

    it('excludes the given id, so a friend does not collide with themselves', () => {
        expect(
            findDuplicateFriend([priya, jordan], { email: 'priya@example.com' }, 'friend-1'),
        ).toBeUndefined();
    });

    it('ignores empty email and phone values', () => {
        expect(findDuplicateFriend([priya, jordan], {})).toBeUndefined();
    });
});
