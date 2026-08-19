export interface ParticipantNameItem {
    name: string;
    isCurrentUser?: boolean;
}

/**
 * Disambiguates participant names for display (e.g. pie chart labels):
 * - Uses only the first name when the first name is unique.
 * - When multiple participants share the same first name, appends the shortest
 *   unique prefix of their remaining name (e.g. "Vijay S" vs "Vijay T", or
 *   "Vijay Sr" vs "Vijay Si").
 * - Appends " (You)" for the current user.
 */
export function disambiguateParticipantNames(
    members: ReadonlyArray<ParticipantNameItem>,
): string[] {
    const parsed = members.map((member) => {
        const trimmed = member.name.trim();
        const spaceIndex = trimmed.indexOf(' ');
        if (spaceIndex === -1) {
            return {
                original: member.name,
                firstName: trimmed,
                remainder: '',
                isCurrentUser: Boolean(member.isCurrentUser),
            };
        }
        return {
            original: member.name,
            firstName: trimmed.slice(0, spaceIndex),
            remainder: trimmed.slice(spaceIndex + 1).trim(),
            isCurrentUser: Boolean(member.isCurrentUser),
        };
    });

    const groups = new Map<string, number[]>();
    parsed.forEach((item, index) => {
        const key = item.firstName.toLocaleLowerCase();
        const list = groups.get(key) ?? [];
        list.push(index);
        groups.set(key, list);
    });

    const result = new Array<string>(members.length);

    for (const indices of groups.values()) {
        if (indices.length === 1) {
            const item = parsed[indices[0]!]!;
            const baseName = item.firstName || item.original;
            result[indices[0]!] = item.isCurrentUser ? `${baseName} (You)` : baseName;
            continue;
        }

        for (const idx of indices) {
            const current = parsed[idx]!;
            if (!current.remainder) {
                const baseName = current.firstName || current.original;
                result[idx] = current.isCurrentUser ? `${baseName} (You)` : baseName;
                continue;
            }

            let prefixLength = 1;
            const currentRemainderLower = current.remainder.toLocaleLowerCase();

            while (prefixLength < current.remainder.length) {
                const currentPrefix = currentRemainderLower.slice(0, prefixLength);
                let hasCollision = false;

                for (const otherIdx of indices) {
                    if (otherIdx === idx) continue;
                    const other = parsed[otherIdx]!;
                    if (!other.remainder) continue;
                    const otherPrefix = other.remainder.toLocaleLowerCase().slice(0, prefixLength);
                    if (currentPrefix === otherPrefix) {
                        hasCollision = true;
                        break;
                    }
                }

                if (!hasCollision) {
                    break;
                }
                prefixLength++;
            }

            const remainderPrefix = current.remainder.slice(0, prefixLength);
            const baseName = `${current.firstName} ${remainderPrefix}`;
            result[idx] = current.isCurrentUser ? `${baseName} (You)` : baseName;
        }
    }

    return result;
}
