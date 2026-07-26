import { Pencil, Plus, UsersRound } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import type { Group } from '../../lib/storage/models';
import { CURRENT_USER_ID } from '../../lib/storage/seed';
import { useFriends } from '../friends/useFriends';
import { UpsertGroupDialog } from './UpsertGroupDialog';
import type { UpsertGroupFormValues } from './UpsertGroupForm';
import { useCreateGroup } from './useCreateGroup';
import { useGroups } from './useGroups';
import { useUpdateGroup } from './useUpdateGroup';

export function GroupsPage() {
    const { data: groups, isLoading, isError } = useGroups();
    const { data: friends } = useFriends();
    const createGroup = useCreateGroup();
    const updateGroup = useUpdateGroup();

    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<Group | null>(null);

    const handleCreateGroup = (values: UpsertGroupFormValues) => {
        const toastId = toast.loading('Group is being created…');
        createGroup.mutate(values, {
            onSuccess: () => toast.success('Group created', { id: toastId }),
            onError: (error) => toast.error(error.message, { id: toastId }),
        });
    };

    const handleEditGroup = (values: UpsertGroupFormValues) => {
        if (!editingGroup) return;
        const toastId = toast.loading('Group is being updated…');
        updateGroup.mutate(
            { id: editingGroup.id, ...values },
            {
                onSuccess: () => toast.success('Group updated', { id: toastId }),
                onError: (error) => toast.error(error.message, { id: toastId }),
            },
        );
    };

    return (
        <div>
            <div className="mb-4 flex justify-end">
                <button
                    type="button"
                    onClick={() => setAddDialogOpen(true)}
                    className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-border px-4 py-2 text-sm font-medium text-surface-foreground hover:bg-muted"
                >
                    <Plus className="size-4" />
                    Create group
                </button>
            </div>

            {isLoading ? (
                <div className="text-muted-foreground">Loading groups…</div>
            ) : isError ? (
                <div className="text-red-600">Couldn't load groups.</div>
            ) : !groups || groups.length === 0 ? (
                <div className="text-muted-foreground">No groups yet.</div>
            ) : (
                <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {groups.map((group) => (
                        <li
                            key={group.id}
                            className="flex items-center gap-3 rounded-lg border border-border p-3"
                        >
                            <span className="flex size-9 items-center justify-center rounded-full bg-brand-600 text-white">
                                <UsersRound className="size-4" />
                            </span>
                            <div className="flex-1">
                                <p className="font-medium text-surface-foreground">{group.name}</p>
                                <p className="text-sm text-muted-foreground">
                                    {group.memberIds.length}{' '}
                                    {group.memberIds.length === 1 ? 'member' : 'members'}
                                </p>
                            </div>
                            <button
                                type="button"
                                aria-label={`Edit ${group.name}`}
                                onClick={() => setEditingGroup(group)}
                                className="cursor-pointer rounded-md p-1.5 text-muted-foreground hover:bg-muted"
                            >
                                <Pencil className="size-4" />
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            <UpsertGroupDialog
                mode="add"
                open={addDialogOpen}
                onOpenChange={setAddDialogOpen}
                friends={friends ?? []}
                onSubmit={handleCreateGroup}
            />

            <UpsertGroupDialog
                mode="edit"
                open={editingGroup !== null}
                onOpenChange={(open) => {
                    if (!open) setEditingGroup(null);
                }}
                friends={friends ?? []}
                initialValues={{
                    name: editingGroup?.name ?? '',
                    memberIds: editingGroup?.memberIds.filter((id) => id !== CURRENT_USER_ID) ?? [],
                }}
                onSubmit={handleEditGroup}
            />
        </div>
    );
}
