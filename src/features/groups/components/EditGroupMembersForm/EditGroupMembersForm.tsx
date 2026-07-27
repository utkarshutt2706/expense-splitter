import { Check } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';

import type { User } from '@data/entities';
import { MemberCheckboxList } from '../MemberCheckboxList';

export interface EditGroupMembersFormValues {
    memberIds: string[];
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
    const [memberIds, setMemberIds] = useState<string[]>(initialMemberIds);
    const [error, setError] = useState<string | undefined>();

    const toggleMember = (id: string) => {
        setMemberIds((current) =>
            current.includes(id) ? current.filter((memberId) => memberId !== id) : [...current, id],
        );
    };

    const submit = (event: FormEvent) => {
        event.preventDefault();
        if (memberIds.length === 0) {
            setError('A group needs at least one member');
            return;
        }
        onSubmit({ memberIds });
    };

    return (
        <form onSubmit={submit} noValidate className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-surface-foreground">Members</span>
                <MemberCheckboxList
                    users={users}
                    selectedIds={memberIds}
                    onToggle={toggleMember}
                    emptyMessage="No members to show."
                />
                {error && <p className="text-xs text-red-600">{error}</p>}
            </div>

            <div className="flex justify-end gap-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="cursor-pointer rounded-md border border-border px-4 py-2 text-sm font-medium text-surface-foreground hover:bg-muted"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="inline-flex cursor-pointer items-center gap-1 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
                >
                    <Check className="size-4" />
                    Save changes
                </button>
            </div>
        </form>
    );
}
