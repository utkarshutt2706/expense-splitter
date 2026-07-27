import { Skeleton } from '@shared/components';

function avatarSkeletonCircle(key: number) {
    return <Skeleton key={key} className="size-9 rounded-full ring-2 ring-surface" />;
}

// Mirrors GroupMembersStack's default maxVisibleMobile/maxVisible (2 vs 5), so
// whichever row a breakpoint shows already has the right placeholder count.
export function MemberAvatarsSkeleton() {
    return (
        <div aria-hidden="true">
            <div className="flex -space-x-3 md:hidden">
                {Array.from({ length: 3 }, (_, index) => avatarSkeletonCircle(index))}
            </div>
            <div className="hidden -space-x-3 md:flex">
                {Array.from({ length: 6 }, (_, index) => avatarSkeletonCircle(index))}
            </div>
        </div>
    );
}
