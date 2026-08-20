import type { User } from '@data/entities';
import { SearchInput } from '@shared/components';
import { FriendSearchResult } from '../FriendSearchResult';
import { MemberCheckboxList } from '../MemberCheckboxList';

interface MemberSearchSectionProps {
    readonly search: string;
    readonly onSearchChange: (value: string) => void;
    readonly visibleUsers: User[];
    readonly selectedIds: string[];
    readonly onToggle: (id: string) => void;
    readonly onFound: (user: User) => void;
    readonly emptyMessage?: string;
    readonly currentUserId?: string;
    readonly lockCurrentUser?: boolean;
    readonly priorityIds?: readonly string[];
}

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
                placeholder="Search friends, or find by email/phone"
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
