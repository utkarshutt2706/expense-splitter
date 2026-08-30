import { Loader2, UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';

import type { User } from '@data/entities';
import { useUserLookup } from '@features/users/hooks';
import { Avatar } from '@shared/components';
import { disambiguateParticipantNames } from '@shared/utils';

const LOOKUP_DEBOUNCE_MS = 400;
const MIN_LOOKUP_LENGTH = 3;

type FriendSearchResultProps = Readonly<{
    search: string;
    onFound: (user: User) => void;
}>;

export function FriendSearchResult({ search, onFound }: FriendSearchResultProps) {
    const [debounced, setDebounced] = useState(search.trim());

    useEffect(() => {
        const timer = setTimeout(() => setDebounced(search.trim()), LOOKUP_DEBOUNCE_MS);
        return () => clearTimeout(timer);
    }, [search]);

    const shouldLookup = debounced.length >= MIN_LOOKUP_LENGTH;
    const query = shouldLookup ? { query: debounced } : null;

    const { data: matches, isFetching, isError } = useUserLookup(query);
    const found = matches?.[0];
    const foundLabel = found ? disambiguateParticipantNames([found])[0] : undefined;
    const matchedContact = found?.email ?? found?.phone;

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
                        {foundLabel}
                        {matchedContact && (
                            <span className="text-muted-foreground"> ({matchedContact})</span>
                        )}
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

    if (isError) {
        return <p className="px-1 text-sm text-red-600">Couldn't search right now.</p>;
    }

    return null;
}
