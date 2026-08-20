import { describe, expect, it } from 'vitest';

import { sortMembersByName } from './sortMembers';

const members = [
    { id: 'u3', name: 'Chandra' },
    { id: 'u1', name: 'alice' },
    { id: 'u2', name: 'Bob' },
];

const names = (list: readonly { name: string }[]) => list.map((member) => member.name);

describe('sortMembersByName', () => {
    it('orders by name when no predicates are given', () => {
        expect(names(sortMembersByName(members))).toEqual(['alice', 'Bob', 'Chandra']);
    });

    it('compares names case-insensitively, the way a reader would', () => {
        const mixed = [{ name: 'bob' }, { name: 'Alice' }, { name: 'Bella' }];

        expect(names(sortMembersByName(mixed))).toEqual(['Alice', 'Bella', 'bob']);
    });

    it('pins the current user above everyone, regardless of name', () => {
        const sorted = sortMembersByName(members, { isCurrentUser: (m) => m.id === 'u3' });

        expect(names(sorted)).toEqual(['Chandra', 'alice', 'Bob']);
    });

    it('keeps the remainder alphabetical below the pinned current user', () => {
        const sorted = sortMembersByName(members, { isCurrentUser: (m) => m.id === 'u2' });

        expect(names(sorted)).toEqual(['Bob', 'alice', 'Chandra']);
    });

    it('floats the priority band above the rest, each band alphabetical', () => {
        const sorted = sortMembersByName(members, {
            isPriority: (m) => m.id === 'u3',
        });

        expect(names(sorted)).toEqual(['Chandra', 'alice', 'Bob']);
    });

    it('ranks the current user above the priority band', () => {
        const sorted = sortMembersByName(members, {
            isCurrentUser: (m) => m.id === 'u1',
            isPriority: (m) => m.id !== 'u1',
        });

        expect(names(sorted)).toEqual(['alice', 'Bob', 'Chandra']);
    });

    it('sorts within each band rather than only partitioning', () => {
        const roster = [
            { id: 'u4', name: 'Zoe' },
            { id: 'u1', name: 'Nina' },
            { id: 'u2', name: 'Dev' },
            { id: 'u3', name: 'Ana' },
        ];

        const sorted = sortMembersByName(roster, {
            isCurrentUser: (m) => m.id === 'u1',
            isPriority: (m) => ['u2', 'u4'].includes(m.id),
        });

        expect(names(sorted)).toEqual(['Nina', 'Dev', 'Zoe', 'Ana']);
    });

    it('leaves the caller’s array untouched', () => {
        const original = [...members];

        sortMembersByName(members, { isCurrentUser: (m) => m.id === 'u3' });

        expect(members).toEqual(original);
    });

    it('handles an empty roster', () => {
        expect(sortMembersByName([])).toEqual([]);
    });

    it('works on shapes that identify the current user by a flag rather than an id', () => {
        const shares = [
            { name: 'Priya', isCurrentUser: false },
            { name: 'Zara', isCurrentUser: true },
            { name: 'Arun', isCurrentUser: false },
        ];

        const sorted = sortMembersByName(shares, { isCurrentUser: (m) => m.isCurrentUser });

        expect(names(sorted)).toEqual(['Zara', 'Arun', 'Priya']);
    });
});
