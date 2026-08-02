import { Skeleton } from '@shared/components';

interface MemberListSkeletonProps {
    readonly count?: number;
}

// Mirrors MemberList's row shape (avatar circle + name line + subtext line)
// so the settings page skeleton doesn't collapse/shift once real members load.
export function MemberListSkeleton({ count = 3 }: MemberListSkeletonProps) {
    return (
        <ul aria-hidden="true" className="flex flex-col gap-1">
            {Array.from({ length: count }, (_, index) => (
                <li key={index} className="flex items-center gap-2 rounded-md px-2 py-1.5">
                    <Skeleton className="size-9 shrink-0 rounded-full" />
                    <div className="flex flex-col gap-1.5">
                        <Skeleton className="h-3.5 w-24" />
                        <Skeleton className="h-3 w-32" />
                    </div>
                </li>
            ))}
        </ul>
    );
}
