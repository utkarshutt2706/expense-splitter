import * as Popover from '@radix-ui/react-popover';
import { KeyRound, LogOut, Settings, UserRound } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';

import { ThemeToggleRow } from '@app/components/ThemeToggleRow';
import { UserMenuItem } from '@app/components/UserMenuItem';
import { useCurrentUser } from '@app/hooks';
import { useAuthStore } from '@app/stores';
import { ChangePasswordDialog } from '@features/auth';
import { logout as revokeSession } from '@features/auth/api/authApi';
import { Avatar, ResponsivePopoverContent } from '@shared/components';

type UserMenuProps = Readonly<{
    expanded: boolean;
    /** Defaults suit the sidebar, where the trigger sits at the bottom-left.
     *  The mobile header flips these, since its trigger is top-right. */
    side?: 'top' | 'bottom';
    align?: 'start' | 'end';
}>;

export function UserMenu({ expanded, side = 'top', align = 'start' }: UserMenuProps) {
    const { data: currentUser } = useCurrentUser();
    const logout = useAuthStore((state) => state.logout);
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    const handleLogout = async () => {
        try {
            await revokeSession();
        } catch {
            // Clear the local session even when the server is temporarily unreachable.
        } finally {
            logout();
            navigate('/login', { replace: true });
        }
    };

    return (
        <Popover.Root open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <Popover.Trigger asChild>
                <button
                    type="button"
                    aria-label="Open user menu"
                    className={`hover:bg-border focus-visible:ring-brand-500 flex cursor-pointer items-center gap-3 rounded-md p-1 text-left outline-none focus-visible:ring-2 lg:w-full ${expanded ? 'w-full px-3 py-2' : 'w-fit'}`}
                >
                    <Avatar name={currentUser?.name ?? ''} />
                    <div className={`min-w-0 flex-1 ${expanded ? 'block' : 'hidden'} lg:block`}>
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
                <ResponsivePopoverContent
                    align={align}
                    side={side}
                    sideOffset={8}
                    collisionPadding={8}
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
                    <UserMenuItem icon={UserRound} label="My account" />
                    <UserMenuItem icon={Settings} label="Settings" />
                    <UserMenuItem
                        icon={KeyRound}
                        label="Change password"
                        onClick={() => {
                            setIsMenuOpen(false);
                            setIsChangingPassword(true);
                        }}
                    />
                    <ThemeToggleRow />
                    <div className="bg-border my-1 h-px" />
                    <UserMenuItem icon={LogOut} label="Logout" onClick={handleLogout} />
                </ResponsivePopoverContent>
            </Popover.Portal>
            {isChangingPassword && (
                <ChangePasswordDialog open onOpenChange={setIsChangingPassword} />
            )}
        </Popover.Root>
    );
}
