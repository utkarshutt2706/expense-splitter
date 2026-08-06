import { Mail, Phone } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';

import { useFriends } from '@features/friends';
import {
    Avatar,
    FetchingIndicator,
    SearchInput,
    SearchInputSkeleton,
    SkeletonList,
} from '@shared/components';

export function FriendsPage() {
    const { data: friends, isLoading, isFetching, isError } = useFriends();

    const [search, setSearch] = useState('');

    const hasNoFriends = !isLoading && (!friends || friends.length === 0);
    // isLoading only covers the very first fetch — a mutation elsewhere that
    // invalidates this list (e.g. adding a group member) refetches it in the
    // background with isLoading staying false, so without this the list would
    // just silently sit stale for that refetch's own latency.
    const isRefreshing = !isLoading && isFetching;

    const query = search.trim().toLowerCase();
    const filteredFriends = friends?.filter(
        (friend) =>
            !query ||
            friend.name.toLowerCase().includes(query) ||
            friend.email?.toLowerCase().includes(query) ||
            friend.phone?.toLowerCase().includes(query),
    );

    let content: ReactNode;
    if (isLoading) {
        content = <SkeletonList label="Loading friends…" />;
    } else if (isError) {
        content = <div className="text-red-600">Couldn't load friends.</div>;
    } else if (!friends || friends.length === 0) {
        content = (
            <div className="text-muted-foreground">
                You don&apos;t have any friends yet — friends appear here once you share a group
                with someone.
            </div>
        );
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
                            className="max-w-xs"
                        />
                    )
                )}

                {isRefreshing && <FetchingIndicator />}
            </div>

            {content}
        </div>
    );
}
