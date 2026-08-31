import { UserRound } from 'lucide-react';

export type UserMenuItemProps = Readonly<{
    icon: typeof UserRound;
    label: string;
    onClick?: () => void;
}>;

export function UserMenuItem({ icon: Icon, label, onClick }: UserMenuItemProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="text-surface-foreground hover:bg-muted flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-medium"
        >
            <Icon className="text-muted-foreground size-4" />
            {label}
        </button>
    );
}
