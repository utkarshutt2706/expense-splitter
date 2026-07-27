import type { User } from '@data/entities';

export class DuplicateFriendError extends Error {
    constructor() {
        super('A friend with this email or phone number already exists');
        this.name = 'DuplicateFriendError';
    }
}

export function findDuplicateFriend(
    friends: User[],
    values: { email?: string; phone?: string },
    excludeId?: string,
): User | undefined {
    return friends.find((friend) => {
        if (friend.id === excludeId) return false;
        const emailMatches =
            !!values.email && friend.email?.toLowerCase() === values.email.toLowerCase();
        const phoneMatches = !!values.phone && friend.phone === values.phone;
        return emailMatches || phoneMatches;
    });
}
