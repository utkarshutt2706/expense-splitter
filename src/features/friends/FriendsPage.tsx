import { Mail, Phone, Search, UserPlus } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { toast } from 'sonner';
import type { User } from '../../lib/storage/models';
import { Avatar } from '../../shared/Avatar';
import { ConfirmationDialog } from '../../shared/ConfirmationDialog';
import type { FriendFormValues } from './FriendForm';
import { FriendRowMenu } from './FriendRowMenu';
import { UpsertFriendDialog } from './UpsertFriendDialog';
import { useCreateFriend } from './useCreateFriend';
import { useFriends } from './useFriends';
import { useRemoveFriend } from './useRemoveFriend';
import { useUpdateFriend } from './useUpdateFriend';

export function FriendsPage() {
    const { data: friends, isLoading, isError } = useFriends();
    const createFriend = useCreateFriend();
    const updateFriend = useUpdateFriend();
    const removeFriend = useRemoveFriend();

    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [editingFriend, setEditingFriend] = useState<User | null>(null);
    const [removingFriend, setRemovingFriend] = useState<User | null>(null);
    const [search, setSearch] = useState('');

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
        content = <div className="text-muted-foreground">Loading friends…</div>;
    } else if (isError) {
        content = <div className="text-red-600">Couldn't load friends.</div>;
    } else if (!friends || friends.length === 0) {
        content = <div className="text-muted-foreground">No friends yet.</div>;
    } else if (!filteredFriends || filteredFriends.length === 0) {
        content = <div className="text-muted-foreground">No friends match your search.</div>;
    } else {
        content = (
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredFriends.map((friend) => (
                    <li
                        key={friend.id}
                        className="flex items-center gap-3 rounded-lg border border-border p-3"
                    >
                        <Avatar name={friend.name} />
                        <div className="flex-1">
                            <p className="font-medium text-surface-foreground">{friend.name}</p>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted-foreground">
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
                <div className="relative w-full max-w-xs">
                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="search"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search friends…"
                        aria-label="Search friends"
                        className="w-full rounded-md border border-border bg-surface py-2 pr-3 pl-9 text-sm text-surface-foreground outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                    />
                </div>
                <button
                    type="button"
                    onClick={() => setAddDialogOpen(true)}
                    className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-md border border-border px-4 py-2 text-sm font-medium text-surface-foreground hover:bg-muted"
                >
                    <UserPlus className="size-4" />
                    Add friend
                </button>
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
