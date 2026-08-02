import { Skeleton } from '@shared/components';

interface GroupBalanceListSkeletonProps {
    readonly count?: number;
}

// Mirrors GroupBalanceAccordionList's per-member row shape (a name plus a
// trailing indicator) so GroupBalancePage's loading state doesn't shift once
// real balances arrive.
export function GroupBalanceListSkeleton({ count = 3 }: GroupBalanceListSkeletonProps) {
    return (
        <>
            {Array.from({ length: count }, (_, index) => (
                <div
                    key={index}
                    className="border-border flex items-center justify-between gap-2 rounded-lg border p-3"
                >
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="size-4 shrink-0 rounded-full" />
                </div>
            ))}
        </>
    );
}
