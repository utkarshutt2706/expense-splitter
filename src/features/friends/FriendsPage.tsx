import { useState } from 'react';
import { toast } from 'sonner';
import { Avatar } from '../../shared/Avatar';
import { ConfirmationDialog } from '../../shared/ConfirmationDialog';
import type { User } from '../../lib/storage/models';
import { AddFriendDialog } from './AddFriendDialog';
import { EditFriendDialog } from './EditFriendDialog';
import type { FriendFormValues } from './FriendForm';
import { FriendRowMenu } from './FriendRowMenu';
import { useCreateFriend } from './useCreateFriend';
import { useFriends } from './useFriends';
import { useRemoveFriend } from './useRemoveFriend';
import { useUpdateFriend } from './useUpdateFriend';

export function FriendsPage() {
    const { data: friends, isLoading, isError } = useFriends();
    const createFriend = useCreateFriend();
    const updateFriend = useUpdateFriend();
    const removeFriend = useRemoveFriend();

    const [editingFriend, setEditingFriend] = useState<User | null>(null);
    const [removingFriend, setRemovingFriend] = useState<User | null>(null);

    const handleAddFriend = (values: FriendFormValues) => {
        const toastId = toast.loading('Friend is being added…');
        createFriend.mutate(values, {
            onSuccess: () => toast.success('Friend added', { id: toastId }),
            onError: () => toast.error("Couldn't add friend", { id: toastId }),
        });
    };

    const handleEditFriend = (values: FriendFormValues) => {
        if (!editingFriend) return;
        const toastId = toast.loading('Friend is being updated…');
        updateFriend.mutate(
            { id: editingFriend.id, ...values },
            {
                onSuccess: () => toast.success('Friend updated', { id: toastId }),
                onError: () => toast.error("Couldn't update friend", { id: toastId }),
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

    return (
        <div>
            <div className="mb-4 flex justify-end">
                <AddFriendDialog onSubmit={handleAddFriend} />
            </div>

            {isLoading ? (
                <div className="text-muted-foreground">Loading friends…</div>
            ) : isError ? (
                <div className="text-red-600">Couldn't load friends.</div>
            ) : !friends || friends.length === 0 ? (
                <div className="text-muted-foreground">No friends yet.</div>
            ) : (
                <ul className="flex flex-col gap-3">
                    {friends.map((friend) => (
                        <li
                            key={friend.id}
                            className="flex items-center gap-3 rounded-lg border border-border p-3"
                        >
                            <Avatar name={friend.name} />
                            <div className="flex-1">
                                <p className="font-medium text-surface-foreground">{friend.name}</p>
                                <p className="text-sm text-muted-foreground">{friend.email}</p>
                            </div>
                            <FriendRowMenu
                                friendName={friend.name}
                                onEdit={() => setEditingFriend(friend)}
                                onRemove={() => setRemovingFriend(friend)}
                            />
                        </li>
                    ))}
                </ul>
            )}

            {editingFriend && (
                <EditFriendDialog
                    open={editingFriend !== null}
                    onOpenChange={(open) => {
                        if (!open) setEditingFriend(null);
                    }}
                    initialValues={{ name: editingFriend.name, email: editingFriend.email }}
                    onSubmit={handleEditFriend}
                />
            )}

            {removingFriend && (
                <ConfirmationDialog
                    open={removingFriend !== null}
                    onOpenChange={(open) => {
                        if (!open) setRemovingFriend(null);
                    }}
                    title={`Remove ${removingFriend.name}?`}
                    description="This removes them from your friends list. You can add them again later."
                    confirmLabel="Remove"
                    destructive
                    onConfirm={() => {
                        setRemovingFriend(null);
                        handleRemoveFriend();
                    }}
                />
            )}
        </div>
    );
}
