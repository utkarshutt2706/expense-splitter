import { Plus } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { toast } from 'sonner';

import { useFriends } from '@features/friends';
import { GroupListSkeleton } from '@features/groups/components/GroupListSkeleton';
import { GroupCard } from '@features/groups/components/GroupCard';
import {
    CreateGroupDialog,
    useCreateGroup,
    useGroupSummaries,
    type CreateGroupFormValues,
} from '@features/groups';
import { filterGroups } from '@features/groups/utils/groupList';
import { ActionButtonSkeleton } from '@shared/components/ActionButtonSkeleton';
import { FetchingIndicator } from '@shared/components/FetchingIndicator';
import { SearchInput } from '@shared/components/SearchInput';
import { SearchInputSkeleton } from '@shared/components/SearchInputSkeleton';

export function GroupsPage() {
    const { data: groups, isLoading, isFetching, isError, refetch } = useGroupSummaries();
    const { data: friends } = useFriends();
    const createGroup = useCreateGroup();
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [search, setSearch] = useState('');

    const hasNoGroups = !isLoading && (!groups || groups.length === 0);
    const isRefreshing = !isLoading && isFetching;
    const friendNameById = new Map((friends ?? []).map((friend) => [friend.id, friend.name]));
    const filteredGroups = filterGroups(groups ?? [], search, friendNameById);

    const handleCreateGroup = (values: CreateGroupFormValues) => {
        const toastId = toast.loading('Group is being created…');
        createGroup.mutate(values, {
            onSuccess: () => toast.success('Group created', { id: toastId }),
            onError: (error) => toast.error(error.message, { id: toastId }),
        });
    };

    let content: ReactNode;
    if (isLoading) content = <GroupListSkeleton />;
    else if (isError) {
        content = (
            <div role="alert" className="border-border rounded-xl border p-8 text-center">
                <h2 className="text-xl font-semibold">We couldn’t load your groups.</h2>
                <button
                    type="button"
                    onClick={() => void refetch()}
                    className="text-brand-700 dark:text-brand-300 mt-3 min-h-11 cursor-pointer font-semibold underline underline-offset-4"
                >
                    Try again
                </button>
            </div>
        );
    } else if (!groups?.length) {
        content = (
            <div className="border-border rounded-xl border p-8 text-center">
                <h2 className="text-2xl font-semibold">No groups yet</h2>
                <p className="text-muted-foreground mt-2">
                    Create a group to start sharing expenses with other people.
                </p>
                <button
                    type="button"
                    onClick={() => setAddDialogOpen(true)}
                    className="bg-brand-600 hover:bg-brand-700 mt-5 min-h-11 cursor-pointer rounded-lg px-4 font-semibold text-white"
                >
                    Create group
                </button>
            </div>
        );
    } else if (!filteredGroups.length) {
        content = (
            <div className="border-border rounded-xl border p-8 text-center">
                <h2 className="text-2xl font-semibold">No groups found</h2>
                <p className="text-muted-foreground mt-2">Try a different search.</p>
                <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="text-brand-700 dark:text-brand-300 mt-3 min-h-11 cursor-pointer font-semibold underline underline-offset-4"
                >
                    Clear search
                </button>
            </div>
        );
    } else {
        content = (
            <ul className="space-y-3">
                {filteredGroups.map((group) => (
                    <li key={group.id}>
                        <GroupCard group={group} />
                    </li>
                ))}
            </ul>
        );
    }

    return (
        <div className="mx-auto max-w-5xl">
            <div className="mb-4 flex items-center gap-3">
                {isLoading ? (
                    <SearchInputSkeleton />
                ) : (
                    !hasNoGroups && (
                        <SearchInput
                            value={search}
                            onChange={setSearch}
                            placeholder="Search groups…"
                            ariaLabel="Search groups"
                            className="max-w-sm flex-1"
                        />
                    )
                )}
                {isRefreshing && <FetchingIndicator />}
                {isLoading && <ActionButtonSkeleton className="ml-auto w-36" />}
                {!isLoading && !hasNoGroups && (
                    <button
                        type="button"
                        onClick={() => setAddDialogOpen(true)}
                        className="border-border hover:bg-muted ml-auto inline-flex min-h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg border px-4 text-sm font-semibold"
                    >
                        <Plus className="size-4" /> Create group
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
