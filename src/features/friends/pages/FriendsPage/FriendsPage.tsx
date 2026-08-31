import type { ReactNode } from 'react';
import { useState } from 'react';
import { Link } from 'react-router';

import { useFriends, type Friend } from '@features/friends';
import { FriendRow } from '@features/friends/components/FriendRow';
import { FriendsListSkeleton } from '@features/friends/components/FriendsListSkeleton';
import { FetchingIndicator, SearchInput, SearchInputSkeleton } from '@shared/components';

function normalizedPhone(value: string): string {
    return value.replace(/\D/g, '');
}

function sortFriends(friends: Friend[]): Friend[] {
    return [...friends].sort(
        (left, right) => left.name.localeCompare(right.name) || left.id.localeCompare(right.id),
    );
}

export function FriendsPage() {
    const { data: friends, isLoading, isFetching, isError, refetch } = useFriends();
    const [search, setSearch] = useState('');
    const hasNoFriends = !isLoading && (!friends || friends.length === 0);
    const isRefreshing = !isLoading && isFetching;
    const query = search.trim().toLowerCase();
    const phoneQuery = normalizedPhone(query);
    const filteredFriends = sortFriends(friends ?? []).filter(
        (friend) =>
            !query ||
            friend.name.toLowerCase().includes(query) ||
            friend.email?.toLowerCase().includes(query) ||
            (phoneQuery.length > 0 && normalizedPhone(friend.phone ?? '').includes(phoneQuery)),
    );

    let content: ReactNode;
    if (isLoading) content = <FriendsListSkeleton />;
    else if (isError) {
        content = (
            <div role="alert" className="border-border rounded-xl border p-8 text-center">
                <h2 className="text-xl font-semibold">We couldn’t load your friends.</h2>
                <button
                    type="button"
                    onClick={() => void refetch()}
                    className="text-brand-700 dark:text-brand-300 mt-3 min-h-11 cursor-pointer font-semibold underline underline-offset-4"
                >
                    Try again
                </button>
            </div>
        );
    } else if (!friends?.length) {
        content = (
            <div className="border-border rounded-xl border p-8 text-center">
                <h2 className="text-2xl font-semibold">No friends yet</h2>
                <p className="text-muted-foreground mt-2">
                    People you share a group with will appear here automatically.
                </p>
                <p className="text-muted-foreground">Create a group to get started.</p>
                <Link
                    to="/groups"
                    className="bg-brand-600 hover:bg-brand-700 focus-visible:ring-brand-500 mt-5 inline-flex min-h-11 items-center rounded-lg px-4 font-semibold text-white focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                    Create group
                </Link>
            </div>
        );
    } else if (!filteredFriends.length) {
        content = (
            <div className="border-border rounded-xl border p-8 text-center">
                <h2 className="text-2xl font-semibold">No friends found</h2>
                <p className="text-muted-foreground mt-2">
                    Try a different name, email, or phone number.
                </p>
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
                {filteredFriends.map((friend) => (
                    <FriendRow key={friend.id} friend={friend} />
                ))}
            </ul>
        );
    }

    return (
        <div className="mx-auto max-w-5xl">
            {/* <p className="text-muted-foreground mb-4">People you’ve shared a group with.</p> */}
            <div className="mb-4 flex items-center gap-3">
                {isLoading ? (
                    <SearchInputSkeleton />
                ) : (
                    !hasNoFriends && (
                        <SearchInput
                            value={search}
                            onChange={setSearch}
                            placeholder="Search friends…"
                            ariaLabel="Search friends — people you’ve shared groups with"
                            className="max-w-sm"
                        />
                    )
                )}
                {isRefreshing && <FetchingIndicator />}
            </div>
            {content}
        </div>
    );
}
