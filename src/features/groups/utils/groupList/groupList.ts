import type { GroupSummary } from '@features/groups/api/groupsApi';

export function sortGroups(groups: GroupSummary[]): GroupSummary[] {
    return [...groups].sort((left, right) => {
        if (left.lastActivityAt && right.lastActivityAt) {
            const difference =
                new Date(right.lastActivityAt).getTime() - new Date(left.lastActivityAt).getTime();
            if (difference !== 0) return difference;
        } else if (left.lastActivityAt) return -1;
        else if (right.lastActivityAt) return 1;
        return left.name.localeCompare(right.name);
    });
}

export function filterGroups(
    groups: GroupSummary[],
    search: string,
    memberNameById: ReadonlyMap<string, string>,
): GroupSummary[] {
    const query = search.trim().toLowerCase();
    return sortGroups(groups).filter(
        (group) =>
            !query ||
            group.name.toLowerCase().includes(query) ||
            group.memberIds.some((id) => memberNameById.get(id)?.toLowerCase().includes(query)),
    );
}
