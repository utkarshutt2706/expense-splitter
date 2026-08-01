import { zodResolver } from '@hookform/resolvers/zod';
import { FolderPlus } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import type { User } from '@data/entities';
import { MemberCheckboxList } from '../MemberCheckboxList';

const createGroupSchema = z.object({
    name: z.string().trim().min(1, 'Group name is required'),
});

type CreateGroupInput = z.infer<typeof createGroupSchema>;

export interface CreateGroupFormValues {
    name: string;
    memberIds: string[];
}

interface CreateGroupFormProps {
    readonly friends: User[];
    readonly onSubmit: (values: CreateGroupFormValues) => void;
    readonly onCancel: () => void;
}

export function CreateGroupForm({ friends, onSubmit, onCancel }: CreateGroupFormProps) {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<CreateGroupInput>({ resolver: zodResolver(createGroupSchema) });
    const [memberIds, setMemberIds] = useState<string[]>([]);

    const toggleMember = (id: string) => {
        setMemberIds((current) =>
            current.includes(id) ? current.filter((memberId) => memberId !== id) : [...current, id],
        );
    };

    const submit = handleSubmit((values) => {
        onSubmit({ name: values.name, memberIds });
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

            <div className="flex flex-col gap-1">
                <span className="text-surface-foreground text-sm font-medium">Members</span>
                <MemberCheckboxList
                    users={friends}
                    selectedIds={memberIds}
                    onToggle={toggleMember}
                />
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
