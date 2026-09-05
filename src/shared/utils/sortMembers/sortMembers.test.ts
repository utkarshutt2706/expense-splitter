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

    it('floats a priority member encountered on either side of a comparison', () => {
        const priorityLast = [
            { id: 'regular', name: 'Alice' },
            { id: 'priority', name: 'Zoe' },
        ];
        const priorityFirst = [...priorityLast].reverse();
        const options = { isPriority: (member: { id: string }) => member.id === 'priority' };

        expect(sortMembersByName(priorityLast, options).map(({ id }) => id)).toEqual([
            'priority',
            'regular',
        ]);
        expect(sortMembersByName(priorityFirst, options).map(({ id }) => id)).toEqual([
            'priority',
            'regular',
        ]);
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

    it('preserves input order for equal names within the same band', () => {
        const duplicates = [
            { id: 'first', name: 'Alex' },
            { id: 'second', name: 'Alex' },
        ];

        expect(sortMembersByName(duplicates).map(({ id }) => id)).toEqual(['first', 'second']);
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
