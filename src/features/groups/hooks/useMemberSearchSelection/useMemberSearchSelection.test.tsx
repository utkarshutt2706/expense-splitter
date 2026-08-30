import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { User } from '@features/users/api/usersApi';
import { useMemberSearchSelection } from './useMemberSearchSelection';

const priya: User = { id: 'friend-1', name: 'Priya Sharma', email: 'priya@example.com' };
const jordan: User = { id: 'friend-2', name: 'Jordan Lee', phone: '5551234567' };
const baseUsers: User[] = [priya, jordan];

describe('useMemberSearchSelection', () => {
    it('starts with the given initial member ids and every base user visible', () => {
        const { result } = renderHook(() => useMemberSearchSelection(baseUsers, ['friend-1']));

        expect(result.current.memberIds).toEqual(['friend-1']);
        expect(result.current.visibleUsers).toEqual(baseUsers);
    });

    it('toggles membership on and off', () => {
        const { result } = renderHook(() => useMemberSearchSelection(baseUsers));

        act(() => result.current.toggleMember('friend-1'));
        expect(result.current.memberIds).toEqual(['friend-1']);

        act(() => result.current.toggleMember('friend-1'));
        expect(result.current.memberIds).toEqual([]);
    });

    it('filters visible users by name, email, or phone', () => {
        const { result } = renderHook(() => useMemberSearchSelection(baseUsers));

        act(() => result.current.setSearch('priya'));
        expect(result.current.visibleUsers).toEqual([priya]);

        act(() => result.current.setSearch('555123'));
        expect(result.current.visibleUsers).toEqual([jordan]);

        act(() => result.current.setSearch('nobody'));
        expect(result.current.visibleUsers).toEqual([]);
    });

    it('adds a found user as a member, merges them into visibleUsers, and clears the search', () => {
        const jamie: User = { id: 'user-9', name: 'Jamie Fox', email: 'jamie@example.com' };
        const { result } = renderHook(() => useMemberSearchSelection(baseUsers));

        act(() => result.current.setSearch('jamie@example.com'));
        act(() => result.current.addFoundUser(jamie));

        expect(result.current.memberIds).toEqual(['user-9']);
        expect(result.current.search).toBe('');
        expect(result.current.visibleUsers).toEqual([...baseUsers, jamie]);
    });

    it('does not duplicate a found user already present in baseUsers', () => {
        const { result } = renderHook(() => useMemberSearchSelection(baseUsers));

        act(() => result.current.addFoundUser(priya));

        expect(result.current.visibleUsers).toEqual(baseUsers);
    });
});
