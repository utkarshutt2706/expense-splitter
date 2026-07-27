import { CircleUserRound } from 'lucide-react';

import { getInitials } from '@shared/utils';

interface AvatarProps {
    readonly name: string;
    readonly size?: 'sm' | 'md';
}

const sizeClasses: Record<NonNullable<AvatarProps['size']>, string> = {
    sm: 'size-6 text-xs',
    md: 'size-9 text-sm',
};

const iconSizeClasses: Record<NonNullable<AvatarProps['size']>, string> = {
    sm: 'size-6',
    md: 'size-9',
};

export function Avatar({ name, size = 'md' }: AvatarProps) {
    const initials = getInitials(name);

    if (!initials) {
        return <CircleUserRound className={`${iconSizeClasses[size]} text-muted-foreground`} />;
    }

    return (
        <span
            className={`flex ${sizeClasses[size]} items-center justify-center rounded-full select-none bg-brand-600 font-medium text-white`}
        >
            {initials}
        </span>
    );
}
