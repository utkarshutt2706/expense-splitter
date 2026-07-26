import { Plus, UsersRound } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { useFriends } from '../friends/useFriends';
import { CreateGroupDialog } from './CreateGroupDialog';
import type { CreateGroupFormValues } from './CreateGroupForm';
import { useCreateGroup } from './useCreateGroup';
import { useGroups } from './useGroups';

export function GroupsPage() {
    const { data: groups, isLoading, isError } = useGroups();
    const { data: friends } = useFriends();
    const createGroup = useCreateGroup();

    const [addDialogOpen, setAddDialogOpen] = useState(false);

    const handleCreateGroup = (values: CreateGroupFormValues) => {
        const toastId = toast.loading('Group is being created…');
        createGroup.mutate(values, {
            onSuccess: () => toast.success('Group created', { id: toastId }),
            onError: (error) => toast.error(error.message, { id: toastId }),
        });
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
                        <li key={group.id}>
                            <Link
                                to={`/groups/${group.id}`}
                                className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-muted"
                            >
                                <span className="flex size-9 items-center justify-center rounded-full bg-brand-600 text-white">
                                    <UsersRound className="size-4" />
                                </span>
                                <div className="flex-1">
                                    <p className="font-medium text-surface-foreground">
                                        {group.name}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {group.memberIds.length}{' '}
                                        {group.memberIds.length === 1 ? 'member' : 'members'}
                                    </p>
                                </div>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}

            <CreateGroupDialog
                open={addDialogOpen}
                onOpenChange={setAddDialogOpen}
                friends={friends ?? []}
                onSubmit={handleCreateGroup}
            />
        </div>
    );
}
