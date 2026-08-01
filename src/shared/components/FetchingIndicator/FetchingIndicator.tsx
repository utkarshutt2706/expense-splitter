import { Loader2 } from 'lucide-react';

import { cn } from '@shared/utils';

interface FetchingIndicatorProps {
    readonly label?: string;
    readonly className?: string;
}

// For a background refetch (query already has data, just revalidating — e.g. after
// a mutation invalidates it) — distinct from Skeleton, which stands in for content
// that hasn't loaded yet at all. Callers gate this on `isFetching && !isLoading`.
export function FetchingIndicator({ label = 'Refreshing…', className }: FetchingIndicatorProps) {
    return (
        <Loader2
            role="status"
            aria-label={label}
            className={cn('text-muted-foreground size-4 shrink-0 animate-spin', className)}
        />
    );
}
