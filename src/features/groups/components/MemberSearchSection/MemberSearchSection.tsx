import type { User } from '@data/entities';
import { SearchInput } from '@shared/components';
import { FriendSearchResult } from '../FriendSearchResult';
import { MemberCheckboxList } from '../MemberCheckboxList';

type MemberSearchSectionProps = Readonly<{
    search: string;
    onSearchChange: (value: string) => void;
    visibleUsers: User[];
    selectedIds: string[];
    onToggle: (id: string) => void;
    onFound: (user: User) => void;
    emptyMessage?: string;
    currentUserId?: string;
    lockCurrentUser?: boolean;
    priorityIds?: readonly string[];
}>;

// Shared behind CreateGroupForm and EditGroupMembersForm: the search box, the
// non-friend lookup panel below it, and the member checklist.
export function MemberSearchSection({
    search,
    onSearchChange,
    visibleUsers,
    selectedIds,
    onToggle,
    onFound,
    emptyMessage,
    currentUserId,
    lockCurrentUser,
    priorityIds,
}: MemberSearchSectionProps) {
    return (
        <div className="flex flex-col gap-2">
            <span className="text-surface-foreground text-sm font-medium">Members</span>

            <SearchInput
                value={search}
                onChange={onSearchChange}
                placeholder="Search names, or enter an exact email/phone"
                ariaLabel="Search members"
            />

            <FriendSearchResult search={search} onFound={onFound} />

            <MemberCheckboxList
                users={visibleUsers}
                selectedIds={selectedIds}
                onToggle={onToggle}
                emptyMessage={emptyMessage}
                currentUserId={currentUserId}
                lockCurrentUser={lockCurrentUser}
                priorityIds={priorityIds}
            />
        </div>
    );
}
