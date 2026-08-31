import { Skeleton } from '@shared/components';

export function FriendsListSkeleton() {
    return (
        <output aria-label="Loading friends…" className="block space-y-3">
            {[0, 1, 2, 3].map((item) => (
                <div
                    key={item}
                    className="border-border flex min-h-20 items-center gap-4 rounded-xl border p-4"
                >
                    <Skeleton className="size-11 shrink-0 rounded-full" />
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                        <Skeleton className="h-5 w-36 max-w-full" />
                        <Skeleton className="h-4 w-56 max-w-full" />
                    </div>
                    <Skeleton className="hidden h-4 w-28 sm:block" />
                </div>
            ))}
        </output>
    );
}
