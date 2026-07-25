import { CircleUserRound } from 'lucide-react';
import { getInitials } from '../lib/initials';

interface AvatarProps {
    name: string;
}

export function Avatar({ name }: AvatarProps) {
    const initials = getInitials(name);

    if (!initials) {
        return <CircleUserRound className="size-9 text-muted-foreground" />;
    }

    return (
        <span className="flex size-9 items-center justify-center rounded-full select-none bg-brand-600 text-sm font-medium text-white">
            {initials}
        </span>
    );
}
