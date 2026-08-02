import { Mail, Phone, UserPlus } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { toast } from 'sonner';

import type { User } from '@data/entities';
import { useFriends } from '@features/friends';
import { type FriendFormValues } from '@features/friends/components/FriendForm';
import { FriendRowMenu } from '@features/friends/components/FriendRowMenu';
import { UpsertFriendDialog } from '@features/friends/components/UpsertFriendDialog';
import { useCreateFriend } from '@features/friends/hooks/useCreateFriend';
import { useRemoveFriend } from '@features/friends/hooks/useRemoveFriend';
import { useUpdateFriend } from '@features/friends/hooks/useUpdateFriend';
import {
    ActionButtonSkeleton,
    Avatar,
    ConfirmationDialog,
    FetchingIndicator,
    SearchInput,
    SearchInputSkeleton,
    SkeletonList,
} from '@shared/components';

export function FriendsPage() {
    const { data: friends, isLoading, isFetching, isError } = useFriends();
    const createFriend = useCreateFriend();
    const updateFriend = useUpdateFriend();
    const removeFriend = useRemoveFriend();

    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [editingFriend, setEditingFriend] = useState<User | null>(null);
    const [removingFriend, setRemovingFriend] = useState<User | null>(null);
    const [search, setSearch] = useState('');

    const hasNoFriends = !isLoading && (!friends || friends.length === 0);
    // isLoading only covers the very first fetch — adding/editing/removing a
    // friend refetches the list in the background with isLoading staying false,
    // so without this the list would just silently sit stale for that refetch's
    // own latency.
    const isRefreshing = !isLoading && isFetching;

    const query = search.trim().toLowerCase();
    const filteredFriends = friends?.filter(
        (friend) =>
            !query ||
            friend.name.toLowerCase().includes(query) ||
            friend.email?.toLowerCase().includes(query) ||
            friend.phone?.toLowerCase().includes(query),
    );

    const handleAddFriend = (values: FriendFormValues) => {
        const toastId = toast.loading('Friend is being added…');
        createFriend.mutate(values, {
            onSuccess: () => toast.success('Friend added', { id: toastId }),
            onError: (error) => toast.error(error.message, { id: toastId }),
        });
    };

    const handleEditFriend = (values: FriendFormValues) => {
        if (!editingFriend) return;
        const toastId = toast.loading('Friend is being updated…');
        updateFriend.mutate(
            { id: editingFriend.id, ...values },
            {
                onSuccess: () => toast.success('Friend updated', { id: toastId }),
                onError: (error) => toast.error(error.message, { id: toastId }),
            },
        );
    };

    const handleRemoveFriend = () => {
        if (!removingFriend) return;
        const toastId = toast.loading('Friend is being removed…');
        removeFriend.mutate(removingFriend.id, {
            onSuccess: () => toast.success('Friend removed', { id: toastId }),
            onError: (error) => toast.error(error.message, { id: toastId }),
        });
    };

    let content: ReactNode;
    if (isLoading) {
        content = <SkeletonList label="Loading friends…" />;
    } else if (isError) {
        content = <div className="text-red-600">Couldn't load friends.</div>;
    } else if (!friends || friends.length === 0) {
        content = <div className="text-muted-foreground">No friends yet.</div>;
    } else if (!filteredFriends || filteredFriends.length === 0) {
        content = <div className="text-muted-foreground">No friends match your search.</div>;
    } else {
        content = (
            <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {filteredFriends.map((friend) => (
                    <li
                        key={friend.id}
                        className="border-border flex items-center gap-3 rounded-lg border p-3"
                    >
                        <Avatar name={friend.name} />
                        <div className="flex-1">
                            <p className="text-surface-foreground font-medium">{friend.name}</p>
                            <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm">
                                {friend.email && (
                                    <span className="inline-flex items-center gap-1">
                                        <Mail className="size-3.5" />
                                        {friend.email}
                                    </span>
                                )}
                                {friend.phone && (
                                    <span className="inline-flex items-center gap-1">
                                        <Phone className="size-3.5" />
                                        {friend.phone}
                                    </span>
                                )}
                            </div>
                        </div>
                        <FriendRowMenu
                            friendName={friend.name}
                            onEdit={() => setEditingFriend(friend)}
                            onRemove={() => setRemovingFriend(friend)}
                        />
                    </li>
                ))}
            </ul>
        );
    }

    return (
        <div>
            <div className="mb-4 flex items-center justify-between gap-3">
                {isLoading ? (
                    <SearchInputSkeleton />
                ) : (
                    !hasNoFriends && (
                        <SearchInput
                            value={search}
                            onChange={setSearch}
                            placeholder="Search friends…"
                            ariaLabel="Search friends"
                        />
                    )
                )}

                <div className="ml-auto flex shrink-0 items-center gap-2">
                    {isRefreshing && <FetchingIndicator />}

                    {isLoading ? (
                        <ActionButtonSkeleton className="w-32" />
                    ) : (
                        <button
                            type="button"
                            onClick={() => setAddDialogOpen(true)}
                            className="border-border text-surface-foreground hover:bg-muted inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-md border px-4 py-2 text-sm font-medium"
                        >
                            <UserPlus className="size-4" />
                            Add friend
                        </button>
                    )}
                </div>
            </div>

            {content}

            <UpsertFriendDialog
                mode="add"
                open={addDialogOpen}
                onOpenChange={setAddDialogOpen}
                onSubmit={handleAddFriend}
            />

            <UpsertFriendDialog
                mode="edit"
                open={editingFriend !== null}
                onOpenChange={(open) => {
                    if (!open) setEditingFriend(null);
                }}
                initialValues={{
                    name: editingFriend?.name ?? '',
                    email: editingFriend?.email,
                    phone: editingFriend?.phone,
                }}
                onSubmit={handleEditFriend}
            />

            <ConfirmationDialog
                open={removingFriend !== null}
                onOpenChange={(open) => {
                    if (!open) setRemovingFriend(null);
                }}
                title={`Remove ${removingFriend?.name ?? ''}?`}
                description="This removes them from your friends list. You can add them again later."
                confirmLabel="Remove"
                destructive
                onConfirm={() => {
                    setRemovingFriend(null);
                    handleRemoveFriend();
                }}
            />
        </div>
    );
}
