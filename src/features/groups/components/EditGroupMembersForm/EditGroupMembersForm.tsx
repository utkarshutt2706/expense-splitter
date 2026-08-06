import { Check, X } from 'lucide-react';
import type { SubmitEvent } from 'react';
import { useState } from 'react';

import { useCurrentUser } from '@app/hooks';
import type { User } from '@data/entities';
import { SearchInput } from '@shared/components';
import { FriendSearchResult } from '../FriendSearchResult';
import { MemberCheckboxList } from '../MemberCheckboxList';

export interface EditGroupMembersFormValues {
    memberIds: string[];
    inviteEmails: string[];
}

interface EditGroupMembersFormProps {
    readonly users: User[];
    readonly initialMemberIds: string[];
    readonly onSubmit: (values: EditGroupMembersFormValues) => void;
    readonly onCancel: () => void;
}

function matchesSearch(user: User, query: string): boolean {
    const target = query.toLowerCase();
    return (
        user.name.toLowerCase().includes(target) ||
        (user.email?.toLowerCase().includes(target) ?? false) ||
        (user.phone?.toLowerCase().includes(target) ?? false)
    );
}

export function EditGroupMembersForm({
    users,
    initialMemberIds,
    onSubmit,
    onCancel,
}: EditGroupMembersFormProps) {
    const { data: currentUser } = useCurrentUser();
    const [memberIds, setMemberIds] = useState<string[]>(initialMemberIds);
    const [foundUsers, setFoundUsers] = useState<User[]>([]);
    const [inviteEmails, setInviteEmails] = useState<string[]>([]);
    const [search, setSearch] = useState('');

    const toggleMember = (id: string) => {
        if (id === currentUser?.id) return;

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

    const addInvite = (email: string) => {
        setInviteEmails((current) => (current.includes(email) ? current : [...current, email]));
        setSearch('');
    };

    const removeInvite = (email: string) => {
        setInviteEmails((current) => current.filter((invited) => invited !== email));
    };

    // foundUsers holds people discovered via search who aren't friends (yet) --
    // merged in so they render, checked, in the same list as everyone else.
    const allUsers = [
        ...users,
        ...foundUsers.filter((found) => !users.some((user) => user.id === found.id)),
    ];
    const query = search.trim();
    const visibleUsers = query ? allUsers.filter((candidate) => matchesSearch(candidate, query)) : allUsers;

    const submit = (event: SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();
        onSubmit({ memberIds, inviteEmails });
    };

    return (
        <form onSubmit={submit} noValidate className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
                <span className="text-surface-foreground text-sm font-medium">Members</span>

                <SearchInput
                    value={search}
                    onChange={setSearch}
                    placeholder="Search friends, or find by email/phone"
                    ariaLabel="Search members"
                />

                <FriendSearchResult
                    search={search}
                    hasLocalMatches={visibleUsers.length > 0}
                    pendingInvites={inviteEmails}
                    onFound={addFoundUser}
                    onInvite={addInvite}
                />

                <MemberCheckboxList
                    users={visibleUsers}
                    selectedIds={memberIds}
                    onToggle={toggleMember}
                    emptyMessage="No members to show."
                    currentUserId={currentUser?.id ?? ''}
                    lockCurrentUser
                />

                {inviteEmails.length > 0 && (
                    <ul className="flex flex-col gap-1">
                        {inviteEmails.map((email) => (
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
                                        onClick={() => removeInvite(email)}
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

            <div className="flex justify-end gap-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="border-border text-surface-foreground hover:bg-muted cursor-pointer rounded-md border px-4 py-2 text-sm font-medium"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="bg-brand-600 hover:bg-brand-700 inline-flex cursor-pointer items-center gap-1 rounded-md px-4 py-2 text-sm font-medium text-white"
                >
                    <Check className="size-4" />
                    Save changes
                </button>
            </div>
        </form>
    );
}
