import { Loader2, Mail, UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';

import type { User } from '@data/entities';
import { useUserLookup } from '@features/users/hooks';
import { ApiError } from '@lib/api/apiError';
import { Avatar } from '@shared/components';

const LOOKUP_DEBOUNCE_MS = 400;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[6-9]\d{9}$/;

interface FriendSearchResultProps {
    // The raw, live search text -- debounced internally before it triggers a lookup.
    readonly search: string;
    // Whether the parent's own local filter (friends, plus already-found users)
    // already matched something for this search text. When true, no remote
    // lookup is needed -- the match is already visible in the list below.
    readonly hasLocalMatches: boolean;
    readonly pendingInvites: string[];
    readonly onFound: (user: User) => void;
    readonly onInvite: (email: string) => void;
}

export function FriendSearchResult({
    search,
    hasLocalMatches,
    pendingInvites,
    onFound,
    onInvite,
}: FriendSearchResultProps) {
    const [debounced, setDebounced] = useState(search.trim());

    useEffect(() => {
        const timer = setTimeout(() => setDebounced(search.trim()), LOOKUP_DEBOUNCE_MS);
        return () => clearTimeout(timer);
    }, [search]);

    const isEmail = EMAIL_PATTERN.test(debounced);
    const isPhone = PHONE_PATTERN.test(debounced);
    const alreadyQueued = isEmail && pendingInvites.includes(debounced);

    const shouldLookup = (isEmail || isPhone) && !hasLocalMatches && !alreadyQueued;
    const query = shouldLookup ? (isEmail ? { email: debounced } : { phone: debounced }) : null;

    const {
        data: found,
        isFetching,
        isError,
        error,
    } = useUserLookup(query as { email: string } | { phone: string } | null);

    if (!shouldLookup) {
        return null;
    }

    if (isFetching) {
        return (
            <p className="text-muted-foreground flex items-center gap-2 px-1 text-sm">
                <Loader2 className="size-4 animate-spin" />
                Searching…
            </p>
        );
    }

    if (found) {
        return (
            <div className="border-border flex items-center justify-between gap-2 rounded-md border px-3 py-2">
                <span className="flex items-center gap-2">
                    <Avatar name={found.name} size="sm" />
                    <span className="text-surface-foreground text-sm">
                        {found.name}{' '}
                        <span className="text-muted-foreground">
                            ({found.email ?? found.phone})
                        </span>
                    </span>
                </span>
                <button
                    type="button"
                    onClick={() => onFound(found)}
                    className="border-border text-surface-foreground hover:bg-muted inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium"
                >
                    <UserPlus className="size-3.5" />
                    Add
                </button>
            </div>
        );
    }

    const notFound = isError && error instanceof ApiError && error.code === 'NOT_FOUND';

    if (notFound && isEmail) {
        return (
            <div className="border-border flex flex-col gap-1 rounded-md border px-3 py-2 text-sm">
                <p className="text-surface-foreground">{debounced} isn't registered with us yet.</p>
                <button
                    type="button"
                    onClick={() => onInvite(debounced)}
                    className="text-brand-600 hover:text-brand-700 inline-flex w-fit cursor-pointer items-center gap-1 text-xs font-medium"
                >
                    <Mail className="size-3.5" />
                    Invite them to this group
                </button>
            </div>
        );
    }

    if (notFound && isPhone) {
        return (
            <p className="text-muted-foreground px-1 text-sm">
                We couldn't find anyone with that phone number. Try searching by their email
                instead.
            </p>
        );
    }

    if (isError) {
        return <p className="px-1 text-sm text-red-600">Couldn't search right now.</p>;
    }

    return null;
}
