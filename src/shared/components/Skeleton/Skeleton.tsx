import { cn } from '@shared/utils';

interface SkeletonProps {
    readonly className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
    return (
        <div aria-hidden="true" className={cn('bg-muted animate-pulse rounded-md', className)} />
    );
}
