import { Skeleton } from '@shared/components/Skeleton';

// Matches SearchInput's rendered size — used in place of it while a list page's
// first fetch is still in flight (no point letting people search a list that
// hasn't loaded yet).
export function SearchInputSkeleton() {
    return <Skeleton className="h-9 w-full max-w-xs" />;
}
