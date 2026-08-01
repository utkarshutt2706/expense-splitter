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
        return (
            <CircleUserRound
                className={`${iconSizeClasses[size]} text-muted-foreground shrink-0`}
            />
        );
    }

    return (
        <span
            className={`flex ${sizeClasses[size]} bg-brand-600 shrink-0 items-center justify-center rounded-full font-medium text-white select-none`}
        >
            {initials}
        </span>
    );
}
