import { X } from 'lucide-react';

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
    readonly pendingInvites: string[];
    readonly onFound: (user: User) => void;
    readonly onInvite: (email: string) => void;
    readonly onRemoveInvite: (email: string) => void;
    readonly emptyMessage?: string;
    readonly currentUserId?: string;
    readonly lockCurrentUser?: boolean;
}

// Shared behind CreateGroupForm and EditGroupMembersForm: the search box,
// the non-friend lookup panel below it, the member checklist, and the
// removable "pending invite" chips for queued unregistered emails.
export function MemberSearchSection({
    search,
    onSearchChange,
    visibleUsers,
    selectedIds,
    onToggle,
    pendingInvites,
    onFound,
    onInvite,
    onRemoveInvite,
    emptyMessage,
    currentUserId,
    lockCurrentUser,
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

            <FriendSearchResult
                search={search}
                hasLocalMatches={visibleUsers.length > 0}
                pendingInvites={pendingInvites}
                onFound={onFound}
                onInvite={onInvite}
            />

            <MemberCheckboxList
                users={visibleUsers}
                selectedIds={selectedIds}
                onToggle={onToggle}
                emptyMessage={emptyMessage}
                currentUserId={currentUserId}
                lockCurrentUser={lockCurrentUser}
            />

            {pendingInvites.length > 0 && (
                <ul className="flex flex-col gap-1">
                    {pendingInvites.map((email) => (
                        <li
                            key={email}
                            className="border-border bg-muted flex items-center justify-between gap-2 rounded-md border px-2 py-1.5 text-sm"
                        >
                            <span className="text-surface-foreground">{email}</span>
                            <span className="flex items-center gap-2">
                                <span className="text-muted-foreground text-xs">
                                    Invite pending
                                </span>
                                <button
                                    type="button"
                                    onClick={() => onRemoveInvite(email)}
                                    aria-label={`Remove invite for ${email}`}
                                    className="text-muted-foreground hover:text-surface-foreground cursor-pointer"
                                >
                                    <X className="size-3.5" />
                                </button>
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
