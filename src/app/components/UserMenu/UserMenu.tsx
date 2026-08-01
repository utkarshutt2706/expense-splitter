import * as Popover from '@radix-ui/react-popover';
import { LogOut, Settings, SunMoon, UserRound } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';

import { useCurrentUser } from '@app/hooks';
import { useAuthStore } from '@app/stores';
import { Avatar } from '@shared/components';

interface MenuItemProps {
    readonly icon: typeof UserRound;
    readonly label: string;
    readonly onClick?: () => void;
}

function MenuItem({ icon: Icon, label, onClick }: MenuItemProps) {
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

function ThemeToggleRow() {
    const [isDark, setIsDark] = useState(false);

    return (
        <button
            type="button"
            role="switch"
            aria-checked={isDark}
            onClick={() => setIsDark((current) => !current)}
            className="text-surface-foreground hover:bg-muted flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-medium"
        >
            <SunMoon className="text-muted-foreground size-4" />
            <span className="flex-1">Theme</span>
            <span
                className={`flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors ${
                    isDark ? 'bg-brand-600' : 'bg-border'
                }`}
            >
                <span
                    className={`size-4 rounded-full bg-white transition-transform ${
                        isDark ? 'translate-x-4' : 'translate-x-0'
                    }`}
                />
            </span>
        </button>
    );
}

interface UserMenuProps {
    readonly expanded: boolean;
}

export function UserMenu({ expanded }: UserMenuProps) {
    const { data: currentUser } = useCurrentUser();
    const logout = useAuthStore((state) => state.logout);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login', { replace: true });
    };

    return (
        <Popover.Root>
            <Popover.Trigger asChild>
                <button
                    type="button"
                    aria-label="Open user menu"
                    className={`hover:bg-border focus-visible:ring-brand-500 flex w-full cursor-pointer items-center gap-3 rounded-md p-1 text-left outline-none focus-visible:ring-2 ${expanded ? 'px-3 py-2' : ''}`}
                >
                    <Avatar name={currentUser?.name ?? ''} />
                    <div className={`min-w-0 flex-1 ${expanded ? 'block' : 'hidden'} md:block`}>
                        <p className="text-surface-foreground truncate text-sm font-medium">
                            {currentUser?.name}
                        </p>
                        <p className="text-muted-foreground truncate text-xs">
                            {currentUser?.email}
                        </p>
                    </div>
                </button>
            </Popover.Trigger>
            <Popover.Portal>
                <Popover.Content
                    align="start"
                    side="top"
                    sideOffset={8}
                    data-testid="user-menu-content"
                    className="border-border bg-surface z-30 w-56 rounded-lg border p-1 shadow-lg"
                >
                    <div className="flex items-center gap-3 px-3 py-2">
                        <Avatar name={currentUser?.name ?? ''} />
                        <div className="min-w-0">
                            <p className="text-surface-foreground truncate text-sm font-medium">
                                {currentUser?.name}
                            </p>
                            <p className="text-muted-foreground truncate text-xs">
                                {currentUser?.email}
                            </p>
                        </div>
                    </div>
                    <div className="bg-border my-1 h-px" />
                    <MenuItem icon={UserRound} label="My account" />
                    <MenuItem icon={Settings} label="Settings" />
                    <ThemeToggleRow />
                    <div className="bg-border my-1 h-px" />
                    <MenuItem icon={LogOut} label="Logout" onClick={handleLogout} />
                </Popover.Content>
            </Popover.Portal>
        </Popover.Root>
    );
}
