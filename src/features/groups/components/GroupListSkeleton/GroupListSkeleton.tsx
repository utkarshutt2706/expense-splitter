import { Skeleton } from '@shared/components/Skeleton';

export function GroupListSkeleton() {
    return (
        <output aria-label="Loading groups…" className="block space-y-3">
            {[0, 1, 2].map((item) => (
                <div
                    key={item}
                    className="border-border flex items-center gap-4 rounded-xl border p-4"
                >
                    <Skeleton className="size-11 shrink-0 rounded-full" />
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                        <Skeleton className="h-5 w-44 max-w-full" />
                        <Skeleton className="h-4 w-64 max-w-full" />
                    </div>
                    <Skeleton className="hidden h-5 w-36 sm:block" />
                </div>
            ))}
        </output>
    );
}
