export interface ParticipantNameItem {
    name: string;
    isCurrentUser?: boolean;
}

interface ParsedParticipantName {
    original: string;
    firstName: string;
    remainder: string;
    isCurrentUser: boolean;
}

function parseParticipantName(member: ParticipantNameItem): ParsedParticipantName {
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
}

function displayName(item: ParsedParticipantName, prefixLength?: number): string {
    const baseName = prefixLength
        ? `${item.firstName} ${item.remainder.slice(0, prefixLength)}`
        : item.firstName || item.original;
    return item.isCurrentUser ? 'You' : baseName;
}

function uniqueRemainderPrefixLength(
    currentIndex: number,
    indices: number[],
    parsed: ParsedParticipantName[],
): number {
    const current = parsed[currentIndex]!;
    const currentRemainder = current.remainder.toLocaleLowerCase();
    for (let length = 1; length < current.remainder.length; length++) {
        const prefix = currentRemainder.slice(0, length);
        const collides = indices.some((otherIndex) => {
            if (otherIndex === currentIndex) return false;
            const otherRemainder = parsed[otherIndex]!.remainder.toLocaleLowerCase();
            return otherRemainder.length > 0 && prefix === otherRemainder.slice(0, length);
        });
        if (!collides) return length;
    }
    return current.remainder.length;
}

/**
 * Uses the shortest unambiguous participant name, comparing first names and
 * remainder prefixes case-insensitively while preserving the stored casing.
 */
export function disambiguateParticipantNames(
    members: ReadonlyArray<ParticipantNameItem>,
): string[] {
    const parsed = members.map(parseParticipantName);

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
            result[indices[0]!] = displayName(parsed[indices[0]!]!);
            continue;
        }

        for (const idx of indices) {
            const current = parsed[idx]!;
            if (!current.remainder) {
                result[idx] = displayName(current);
                continue;
            }
            result[idx] = displayName(current, uniqueRemainderPrefixLength(idx, indices, parsed));
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
    return new Map(members.map((member, index) => [member.id, labels[index]!]));
}
