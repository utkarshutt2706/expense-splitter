import { useMemo } from 'react';

import { Skeleton } from '@shared/components/Skeleton';

interface SkeletonListProps {
    readonly label: string;
    readonly count?: number;
}

export function SkeletonList({ label, count = 6 }: SkeletonListProps) {
    const rowIds = useMemo(() => Array.from({ length: count }, () => crypto.randomUUID()), [count]);

    return (
        <output aria-label={label} className="block">
            <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {rowIds.map((rowId) => (
                    <li
                        key={rowId}
                        className="flex items-center gap-3 rounded-lg border border-border p-3"
                    >
                        <Skeleton className="size-9 shrink-0 rounded-full" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-2/3" />
                            <Skeleton className="h-3 w-1/2" />
                        </div>
                    </li>
                ))}
            </ul>
        </output>
    );
}
