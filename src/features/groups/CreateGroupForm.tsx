import { zodResolver } from '@hookform/resolvers/zod';
import { FolderPlus } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type { User } from '../../lib/storage/models';
import { Avatar } from '../../shared/Avatar';

const createGroupSchema = z.object({
    name: z.string().trim().min(1, 'Group name is required'),
});

type CreateGroupInput = z.infer<typeof createGroupSchema>;

export interface CreateGroupFormValues {
    name: string;
    memberIds: string[];
}

interface CreateGroupFormProps {
    friends: User[];
    onSubmit: (values: CreateGroupFormValues) => void;
    onCancel: () => void;
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
                <label htmlFor="group-name" className="text-sm font-medium text-surface-foreground">
                    Group name
                </label>
                <input
                    id="group-name"
                    type="text"
                    placeholder="Enter a group name"
                    {...register('name')}
                    className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-surface-foreground outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                />
                {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
            </div>

            <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-surface-foreground">Members</span>
                {friends.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        You don't have any friends yet — you can add members later.
                    </p>
                ) : (
                    <ul className="flex max-h-48 flex-col gap-1 overflow-y-auto">
                        {friends.map((friend) => (
                            <li key={friend.id}>
                                <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted">
                                    <input
                                        type="checkbox"
                                        checked={memberIds.includes(friend.id)}
                                        onChange={() => toggleMember(friend.id)}
                                        className="size-4 cursor-pointer accent-brand-600"
                                    />
                                    <Avatar name={friend.name} />
                                    <span className="text-sm text-surface-foreground">
                                        {friend.name}
                                    </span>
                                </label>
                            </li>
                        ))}
                    </ul>
                )}
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
                    <FolderPlus className="size-4" />
                    Create group
                </button>
            </div>
        </form>
    );
}
