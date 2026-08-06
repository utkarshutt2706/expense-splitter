import { Check } from 'lucide-react';
import type { SubmitEvent } from 'react';

import { useCurrentUser } from '@app/hooks';
import type { User } from '@data/entities';
import { useMemberSearchSelection } from '@features/groups/hooks/useMemberSearchSelection';
import { MemberSearchSection } from '../MemberSearchSection';

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

export function EditGroupMembersForm({
    users,
    initialMemberIds,
    onSubmit,
    onCancel,
}: EditGroupMembersFormProps) {
    const { data: currentUser } = useCurrentUser();
    const {
        search,
        setSearch,
        memberIds,
        toggleMember,
        inviteEmails,
        addFoundUser,
        addInvite,
        removeInvite,
        visibleUsers,
    } = useMemberSearchSelection(users, initialMemberIds);

    const handleToggle = (id: string) => {
        if (id === currentUser?.id) return;
        toggleMember(id);
    };

    const submit = (event: SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();
        onSubmit({ memberIds, inviteEmails });
    };

    return (
        <form onSubmit={submit} noValidate className="flex flex-col gap-4">
            <MemberSearchSection
                search={search}
                onSearchChange={setSearch}
                visibleUsers={visibleUsers}
                selectedIds={memberIds}
                onToggle={handleToggle}
                pendingInvites={inviteEmails}
                onFound={addFoundUser}
                onInvite={addInvite}
                onRemoveInvite={removeInvite}
                emptyMessage="No members to show."
                currentUserId={currentUser?.id ?? ''}
                lockCurrentUser
            />

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
