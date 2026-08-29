export interface ParticipantNameItem {
    name: string;
    isCurrentUser?: boolean;
}

/**
 * Uses the shortest unambiguous participant name, comparing first names and
 * remainder prefixes case-insensitively while preserving the stored casing.
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
                const hasCollision = indices.some((otherIdx) => {
                    if (otherIdx === idx) return false;
                    const other = parsed[otherIdx]!;
                    return (
                        other.remainder.length > 0 &&
                        currentPrefix === other.remainder.toLocaleLowerCase().slice(0, prefixLength)
                    );
                });

                if (!hasCollision) break;
                prefixLength++;
            }

            const baseName = `${current.firstName} ${current.remainder.slice(0, prefixLength)}`;
            result[idx] = current.isCurrentUser ? `${baseName} (You)` : baseName;
        }
    }

    return result;
}

export function participantNameMap<T extends { id: string; name: string }>(
    members: ReadonlyArray<T>,
    currentUserId?: string,
): Map<string, string> {
    const labels = disambiguateParticipantNames(
        members.map((member) => ({
            name: member.name,
            isCurrentUser: member.id === currentUserId,
        })),
    );
    return new Map(members.map((member, index) => [member.id, labels[index] ?? member.name]));
}
