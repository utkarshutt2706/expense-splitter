import { zodResolver } from '@hookform/resolvers/zod';
import { FolderPlus, X } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import type { User } from '@data/entities';
import { SearchInput } from '@shared/components';
import { FriendSearchResult } from '../FriendSearchResult';
import { MemberCheckboxList } from '../MemberCheckboxList';

const createGroupSchema = z.object({
    name: z.string().trim().min(1, 'Group name is required'),
});

type CreateGroupInput = z.infer<typeof createGroupSchema>;

export interface CreateGroupFormValues {
    name: string;
    memberIds: string[];
    inviteEmails: string[];
}

interface CreateGroupFormProps {
    readonly friends: User[];
    readonly onSubmit: (values: CreateGroupFormValues) => void;
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

export function CreateGroupForm({ friends, onSubmit, onCancel }: CreateGroupFormProps) {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<CreateGroupInput>({ resolver: zodResolver(createGroupSchema) });
    const [memberIds, setMemberIds] = useState<string[]>([]);
    const [foundUsers, setFoundUsers] = useState<User[]>([]);
    const [inviteEmails, setInviteEmails] = useState<string[]>([]);
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
        ...friends,
        ...foundUsers.filter((found) => !friends.some((friend) => friend.id === found.id)),
    ];
    const query = search.trim();
    const visibleUsers = query ? allUsers.filter((candidate) => matchesSearch(candidate, query)) : allUsers;

    const submit = handleSubmit((values) => {
        onSubmit({ name: values.name, memberIds, inviteEmails });
    });

    return (
        <form onSubmit={submit} noValidate className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
                <label htmlFor="group-name" className="text-surface-foreground text-sm font-medium">
                    Group name
                </label>
                <input
                    id="group-name"
                    type="text"
                    placeholder="Enter a group name"
                    {...register('name')}
                    className="border-border bg-surface text-surface-foreground focus-visible:ring-brand-500 rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2"
                />
                {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
            </div>

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
                    <FolderPlus className="size-4" />
                    Create group
                </button>
            </div>
        </form>
    );
}
