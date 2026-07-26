import { useRef, useState } from 'react';
import { Avatar } from '../../shared/Avatar';
import { AddFriendDialog } from './AddFriendDialog';
import type { AddFriendFormValues } from './AddFriendForm';
import { useCreateFriend } from './useCreateFriend';
import { useFriends } from './useFriends';

const TOAST_DISMISS_MS = 2500;

export function FriendsPage() {
    const { data: friends, isLoading, isError } = useFriends();
    const createFriend = useCreateFriend();
    const [toast, setToast] = useState<string | null>('test');
    const dismissTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

    const showToast = (message: string, autoDismiss: boolean) => {
        clearTimeout(dismissTimeoutRef.current);
        setToast(message);
        if (autoDismiss) {
            dismissTimeoutRef.current = setTimeout(() => setToast(null), TOAST_DISMISS_MS);
        }
    };

    const handleAddFriend = (values: AddFriendFormValues) => {
        showToast('Friend is being added…', false);
        createFriend.mutate(values, {
            onSuccess: () => showToast('Friend added', true),
            onError: () => showToast("Couldn't add friend", true),
        });
    };

    return (
        <div>
            {toast && (
                <div className="fixed right-4 top-11 z-50 rounded-md bg-surface-foreground px-4 py-2 text-sm text-surface shadow-lg">
                    {toast}
                </div>
            )}

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
                            <div>
                                <p className="font-medium text-surface-foreground">{friend.name}</p>
                                <p className="text-sm text-muted-foreground">{friend.email}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
