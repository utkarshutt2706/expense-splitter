import { toast } from 'sonner';
import { Avatar } from '../../shared/Avatar';
import { AddFriendDialog } from './AddFriendDialog';
import type { AddFriendFormValues } from './AddFriendForm';
import { useCreateFriend } from './useCreateFriend';
import { useFriends } from './useFriends';

export function FriendsPage() {
    const { data: friends, isLoading, isError } = useFriends();
    const createFriend = useCreateFriend();

    const handleAddFriend = (values: AddFriendFormValues) => {
        const toastId = toast.loading('Friend is being added…');
        createFriend.mutate(values, {
            onSuccess: () => toast.success('Friend added', { id: toastId }),
            onError: () => toast.error("Couldn't add friend", { id: toastId }),
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
