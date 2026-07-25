import * as Popover from '@radix-ui/react-popover';
import { LogOut, Settings, SunMoon, UserRound } from 'lucide-react';
import { useState } from 'react';
import { Avatar } from '../../shared/Avatar';
import { useCurrentUser } from '../hooks/useCurrentUser';

function MenuItem({ icon: Icon, label }: { icon: typeof UserRound; label: string }) {
    return (
        <button
            type="button"
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-medium cursor-pointer text-surface-foreground hover:bg-muted"
        >
            <Icon className="size-4 text-muted-foreground" />
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
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-medium cursor-pointer text-surface-foreground hover:bg-muted"
        >
            <SunMoon className="size-4 text-muted-foreground" />
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
    expanded: boolean;
}

export function UserMenu({ expanded }: UserMenuProps) {
    const { data: currentUser } = useCurrentUser();

    return (
        <Popover.Root>
            <Popover.Trigger asChild>
                <button
                    type="button"
                    aria-label="Open user menu"
                    className={`flex w-full items-center gap-3 rounded-md p-1 text-left outline-none cursor-pointer hover:bg-border focus-visible:ring-2 focus-visible:ring-brand-500 ${expanded ? 'px-3 py-2' : ''}`}
                >
                    <Avatar name={currentUser?.name ?? ''} />
                    <div className={`min-w-0 flex-1 ${expanded ? 'block' : 'hidden'} md:block`}>
                        <p className="truncate text-sm font-medium text-surface-foreground">
                            {currentUser?.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
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
                    className="z-30 w-56 rounded-lg border border-border bg-surface p-1 shadow-lg"
                >
                    <div className="flex items-center gap-3 px-3 py-2">
                        <Avatar name={currentUser?.name ?? ''} />
                        <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-surface-foreground">
                                {currentUser?.name}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                                {currentUser?.email}
                            </p>
                        </div>
                    </div>
                    <div className="my-1 h-px bg-border" />
                    <MenuItem icon={UserRound} label="My account" />
                    <MenuItem icon={Settings} label="Settings" />
                    <ThemeToggleRow />
                    <div className="my-1 h-px bg-border" />
                    <MenuItem icon={LogOut} label="Logout" />
                </Popover.Content>
            </Popover.Portal>
        </Popover.Root>
    );
}
