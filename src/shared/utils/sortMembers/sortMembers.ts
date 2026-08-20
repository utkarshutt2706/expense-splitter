interface NamedMember {
    name: string;
}

interface SortMembersOptions<T> {
    /** Pinned above everyone else, whatever their name. */
    readonly isCurrentUser?: (member: T) => boolean;
    /**
     * Sorted ahead of the rest but below the current user. The group settings
     * editor uses it to float the group's existing members above the friends
     * and search results offered as candidates.
     */
    readonly isPriority?: (member: T) => boolean;
}

/**
 * The one member ordering the app uses: alphabetical by name, with the current
 * user pinned to the top, and an optional priority band in between.
 *
 * Takes predicates rather than an id, because the shapes differ across callers
 * — group members carry an `id`, dashboard participant shares carry a `userId`
 * and an `isCurrentUser` flag.
 */
export function sortMembersByName<T extends NamedMember>(
    members: readonly T[],
    { isCurrentUser, isPriority }: SortMembersOptions<T> = {},
): T[] {
    return [...members].sort((left, right) => {
        const leftIsCurrentUser = isCurrentUser?.(left) ?? false;
        const rightIsCurrentUser = isCurrentUser?.(right) ?? false;
        if (leftIsCurrentUser !== rightIsCurrentUser) return leftIsCurrentUser ? -1 : 1;

        const leftIsPriority = isPriority?.(left) ?? false;
        const rightIsPriority = isPriority?.(right) ?? false;
        if (leftIsPriority !== rightIsPriority) return leftIsPriority ? -1 : 1;

        return left.name.localeCompare(right.name);
    });
}
