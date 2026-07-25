import { Avatar } from '../../shared/Avatar';
import { useFriends } from './useFriends';

export function FriendsPage() {
    const { data: friends, isLoading, isError } = useFriends();

    if (isLoading) {
        return <div className="text-muted-foreground">Loading friends…</div>;
    }

    if (isError) {
        return <div className="text-red-600">Couldn't load friends.</div>;
    }

    if (!friends || friends.length === 0) {
        return <div className="text-muted-foreground">No friends yet.</div>;
    }

    return (
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
    );
}
