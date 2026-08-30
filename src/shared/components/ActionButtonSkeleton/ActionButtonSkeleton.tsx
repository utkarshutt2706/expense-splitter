import { Skeleton } from '@shared/components/Skeleton';
import { cn } from '@shared/utils';

type ActionButtonSkeletonProps = Readonly<{
    className?: string;
}>;

// Matches a header action button's rendered height — used in place of it while
// a list page's first fetch is still in flight. Width varies by button label
// ("Add friend" vs "Create group"), so callers pass their own width class.
export function ActionButtonSkeleton({ className }: ActionButtonSkeletonProps) {
    return <Skeleton className={cn('h-9 shrink-0', className)} />;
}
