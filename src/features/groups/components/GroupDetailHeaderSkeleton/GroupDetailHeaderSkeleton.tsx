import { MemberAvatarsSkeleton } from '@features/groups/components/MemberAvatarsSkeleton';
import { Skeleton } from '@shared/components';

// Mirrors GroupDetailPage's loaded header row (group name, member avatars,
// settings button) so the page doesn't shift once the real group arrives.
export function GroupDetailHeaderSkeleton() {
    return (
        <>
            <Skeleton className="h-9 w-40" />
            <MemberAvatarsSkeleton />
            <Skeleton className="ml-auto h-9 w-9 rounded-md md:w-32" />
        </>
    );
}
