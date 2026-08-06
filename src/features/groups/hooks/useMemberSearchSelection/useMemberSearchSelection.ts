import { useState } from 'react';

import type { User } from '@data/entities';

function matchesSearch(user: User, query: string): boolean {
    const target = query.toLowerCase();
    return (
        user.name.toLowerCase().includes(target) ||
        (user.email?.toLowerCase().includes(target) ?? false) ||
        (user.phone?.toLowerCase().includes(target) ?? false)
    );
}

// Shared behind CreateGroupForm and EditGroupMembersForm: tracks the search
// text and which members are selected. baseUsers is friends (create) or
// friends-plus-current-members (edit) -- foundUsers holds people discovered
// via search who aren't in that list (yet), merged in so they render,
// checked, alongside everyone else.
export function useMemberSearchSelection(baseUsers: User[], initialMemberIds: string[] = []) {
    const [memberIds, setMemberIds] = useState<string[]>(initialMemberIds);
    const [foundUsers, setFoundUsers] = useState<User[]>([]);
    const [search, setSearch] = useState('');

    const toggleMember = (id: string) => {
        setMemberIds((current) =>
            current.includes(id) ? current.filter((memberId) => memberId !== id) : [...current, id],
        );
    };

    const addFoundUser = (found: User) => {
        setFoundUsers((current) =>
            current.some((user) => user.id === found.id) ? current : [...current, found],
        );
        setMemberIds((current) => (current.includes(found.id) ? current : [...current, found.id]));
        setSearch('');
    };

    const allUsers = [
        ...baseUsers,
        ...foundUsers.filter((found) => !baseUsers.some((user) => user.id === found.id)),
    ];
    const query = search.trim();
    const visibleUsers = query
        ? allUsers.filter((candidate) => matchesSearch(candidate, query))
        : allUsers;

    return {
        search,
        setSearch,
        memberIds,
        toggleMember,
        addFoundUser,
        visibleUsers,
    };
}
