import { describe, expect, it } from 'vitest';

import { disambiguateParticipantNames, participantNameMap } from './disambiguateParticipantNames';

describe('disambiguateParticipantNames', () => {
    it('uses first names when all participants have distinct first names', () => {
        const members = [
            { name: 'Vijay Srivastava', isCurrentUser: false },
            { name: 'Alex Morgan', isCurrentUser: false },
            { name: 'Priya Sharma', isCurrentUser: true },
        ];

        expect(disambiguateParticipantNames(members)).toEqual(['Vijay', 'Alex', 'You']);
    });

    it('disambiguates same first names with 1-letter remainder when prefixes differ', () => {
        const members = [
            { name: 'Vijay Srivastava', isCurrentUser: false },
            { name: 'Vijay Tiwari', isCurrentUser: false },
        ];

        expect(disambiguateParticipantNames(members)).toEqual(['Vijay S', 'Vijay T']);
    });

    it('disambiguates same first names with multi-letter remainder when starting letters match', () => {
        const members = [
            { name: 'Vijay Srivastava', isCurrentUser: false },
            { name: 'Vijay Singh', isCurrentUser: false },
        ];

        expect(disambiguateParticipantNames(members)).toEqual(['Vijay Sr', 'Vijay Si']);
    });

    it('disambiguates when there are 3+ participants sharing the same first name', () => {
        const members = [
            { name: 'Vijay Srivastava', isCurrentUser: false },
            { name: 'Vijay Singh', isCurrentUser: false },
            { name: 'Vijay Tiwari', isCurrentUser: true },
        ];

        expect(disambiguateParticipantNames(members)).toEqual(['Vijay Sr', 'Vijay Si', 'You']);
    });

    it('handles a participant with no last name alongside participants with last names', () => {
        const members = [
            { name: 'Vijay', isCurrentUser: false },
            { name: 'Vijay Srivastava', isCurrentUser: false },
            { name: 'Vijay Tiwari', isCurrentUser: false },
        ];

        expect(disambiguateParticipantNames(members)).toEqual(['Vijay', 'Vijay S', 'Vijay T']);
    });

    it('handles single-word names and preserves current user flag', () => {
        const members = [
            { name: 'Cher', isCurrentUser: true },
            { name: 'Madonna', isCurrentUser: false },
        ];

        expect(disambiguateParticipantNames(members)).toEqual(['You', 'Madonna']);
    });

    it('handles identical full names gracefully', () => {
        const members = [
            { name: 'Vijay Sharma', isCurrentUser: false },
            { name: 'Vijay Sharma', isCurrentUser: true },
        ];

        expect(disambiguateParticipantNames(members)).toEqual(['Vijay Sharma', 'You']);
    });

    it('handles case-insensitivity in first names while preserving original casing in output', () => {
        const members = [
            { name: 'vijay srivastava', isCurrentUser: false },
            { name: 'Vijay Tiwari', isCurrentUser: false },
        ];

        expect(disambiguateParticipantNames(members)).toEqual(['vijay s', 'Vijay T']);
    });

    it('handles leading and extra whitespace cleanly', () => {
        const members = [
            { name: '  Vijay   Srivastava  ', isCurrentUser: false },
            { name: '  Vijay   Tiwari  ', isCurrentUser: false },
        ];

        expect(disambiguateParticipantNames(members)).toEqual(['Vijay S', 'Vijay T']);
    });

    it('handles an empty participant list', () => {
        expect(disambiguateParticipantNames([])).toEqual([]);
    });

    it('preserves an empty stored name without inventing a label', () => {
        expect(disambiguateParticipantNames([{ name: '' }])).toEqual(['']);
    });

    it('uses the shortest available prefixes when one remainder prefixes another', () => {
        const members = [{ name: 'Vijay S' }, { name: 'Vijay Sharma' }];

        expect(disambiguateParticipantNames(members)).toEqual(['Vijay S', 'Vijay Sh']);
    });

    it('preserves identical full names when neither participant is current', () => {
        const members = [{ name: 'Vijay Sharma' }, { name: 'Vijay Sharma' }];

        expect(disambiguateParticipantNames(members)).toEqual(['Vijay Sharma', 'Vijay Sharma']);
    });
});

describe('participantNameMap', () => {
    const members = [
        { id: 'user-1', name: 'Alex Morgan', role: 'member' },
        { id: 'user-2', name: 'Alex Sharma', role: 'admin' },
        { id: 'user-3', name: 'Priya Singh', role: 'member' },
    ];

    it('maps ids to disambiguated labels and marks the current user', () => {
        expect([...participantNameMap(members, 'user-2')]).toEqual([
            ['user-1', 'Alex M'],
            ['user-2', 'You'],
            ['user-3', 'Priya'],
        ]);
    });

    it('does not mark anyone as current when no current-user id is supplied', () => {
        expect([...participantNameMap(members)]).toEqual([
            ['user-1', 'Alex M'],
            ['user-2', 'Alex S'],
            ['user-3', 'Priya'],
        ]);
    });

    it('returns an empty map for an empty participant list', () => {
        expect(participantNameMap([])).toEqual(new Map());
    });
});
