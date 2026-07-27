import { Plus, UsersRound } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { Link } from 'react-router';
import { toast } from 'sonner';

import { useFriends } from '@features/friends';
import {
    CreateGroupDialog,
    useCreateGroup,
    useGroups,
    type CreateGroupFormValues,
} from '@features/groups';
import { SearchInput } from '@shared/components/SearchInput';
import { Skeleton } from '@shared/components/Skeleton';
import { SkeletonList } from '@shared/components/SkeletonList';

export function GroupsPage() {
    const { data: groups, isLoading, isError } = useGroups();
    const { data: friends } = useFriends();
    const createGroup = useCreateGroup();

    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [search, setSearch] = useState('');

    const hasNoGroups = !isLoading && (!groups || groups.length === 0);

    const friendNameById = new Map((friends ?? []).map((friend) => [friend.id, friend.name]));

    const query = search.trim().toLowerCase();
    const filteredGroups = groups?.filter(
        (group) =>
            !query ||
            group.name.toLowerCase().includes(query) ||
            group.memberIds.some((memberId) =>
                friendNameById.get(memberId)?.toLowerCase().includes(query),
            ),
    );

    const handleCreateGroup = (values: CreateGroupFormValues) => {
        const toastId = toast.loading('Group is being created…');
        createGroup.mutate(values, {
            onSuccess: () => toast.success('Group created', { id: toastId }),
            onError: (error) => toast.error(error.message, { id: toastId }),
        });
    };

    let content: ReactNode;
    if (isLoading) {
        content = <SkeletonList label="Loading groups…" />;
    } else if (isError) {
        content = <div className="text-red-600">Couldn't load groups.</div>;
    } else if (!groups || groups.length === 0) {
        content = <div className="text-muted-foreground">No groups yet.</div>;
    } else if (!filteredGroups || filteredGroups.length === 0) {
        content = <div className="text-muted-foreground">No groups match your search.</div>;
    } else {
        content = (
            <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {filteredGroups.map((group) => (
                    <li key={group.id}>
                        <Link
                            to={`/groups/${group.id}`}
                            className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-muted"
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
                        </Link>
                    </li>
                ))}
            </ul>
        );
    }

    return (
        <div>
            <div className="mb-4 flex items-center justify-between gap-3">
                {isLoading ? (
                    <Skeleton className="h-9 w-full max-w-xs" />
                ) : (
                    !hasNoGroups && (
                        <SearchInput
                            value={search}
                            onChange={setSearch}
                            placeholder="Search groups…"
                            ariaLabel="Search groups"
                        />
                    )
                )}

                {isLoading ? (
                    <Skeleton className="ml-auto h-9 w-36 shrink-0" />
                ) : (
                    <button
                        type="button"
                        onClick={() => setAddDialogOpen(true)}
                        className="ml-auto inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-md border border-border px-4 py-2 text-sm font-medium text-surface-foreground hover:bg-muted"
                    >
                        <Plus className="size-4" />
                        Create group
                    </button>
                )}
            </div>

            {content}

            <CreateGroupDialog
                open={addDialogOpen}
                onOpenChange={setAddDialogOpen}
                friends={friends ?? []}
                onSubmit={handleCreateGroup}
            />
        </div>
    );
}
