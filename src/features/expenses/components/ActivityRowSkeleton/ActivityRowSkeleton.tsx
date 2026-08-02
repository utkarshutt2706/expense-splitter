import { Skeleton } from '@shared/components';

// Mirrors ExpenseRow/PaymentRow's shape (leading icon, description + subtext,
// trailing amount + subtext) so GroupActivityList's loading state doesn't
// shift once real rows arrive.
export function ActivityRowSkeleton() {
    return (
        <li className="border-border flex items-center gap-3 rounded-lg border p-3">
            <Skeleton className="size-9 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/2" />
            </div>
            <div className="flex flex-col items-end gap-1.5">
                <Skeleton className="h-4 w-14" />
                <Skeleton className="h-3 w-24" />
            </div>
        </li>
    );
}
