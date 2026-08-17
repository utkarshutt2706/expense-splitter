import { Skeleton } from '@shared/components';

// Mirrors the user-first hierarchy without implying zero or settled balances.
export function GroupBalanceListSkeleton() {
    return (
        <div className="flex flex-col gap-5 sm:gap-6">
            <section>
                <Skeleton className="h-6 w-32" />
                <div className="border-border mt-2 rounded-xl border p-3 sm:mt-3 sm:p-4">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="mt-2 h-4 w-36" />
                </div>
            </section>
            <section>
                <Skeleton className="h-6 w-40" />
                <div className="mt-2 flex flex-col gap-3 sm:mt-3">
                    <Skeleton className="h-16 w-full rounded-lg" />
                    <Skeleton className="h-16 w-full rounded-lg" />
                </div>
            </section>
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
        </div>
    );
}
