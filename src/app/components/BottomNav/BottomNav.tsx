import { NavLink } from 'react-router';

import { navItems } from '@app/configs/navigation';
import { cn } from '@shared/utils';

/**
 * Mobile primary navigation, replacing the old hamburger drawer. Pinned to the
 * bottom of the viewport and padded for the iOS home indicator; AppLayout
 * reserves the matching space at the end of <main> using the same
 * --spacing-bottom-nav token so content is never hidden behind it.
 *
 * Secondary actions that used to live in the drawer (account, settings, change
 * password, theme, logout) stay reachable from the header's UserMenu rather
 * than crowding five primary destinations into this bar.
 */
export function BottomNav() {
    return (
        <nav
            aria-label="Main"
            className="border-border bg-surface fixed inset-x-0 bottom-0 z-30 border-t pb-[env(safe-area-inset-bottom,0px)] md:hidden"
        >
            <div className="h-bottom-nav grid auto-cols-fr grid-flow-col">
                {navItems.map(({ to, label, icon: Icon }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={to === '/'}
                        className={({ isActive }) =>
                            cn(
                                'focus-visible:ring-brand-500 relative flex flex-col items-center justify-center gap-1 px-1 text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-inset',
                                isActive
                                    ? 'text-brand-600'
                                    : 'text-muted-foreground active:bg-muted',
                            )
                        }
                    >
                        {({ isActive }) => (
                            <>
                                {/* Shape cue alongside the colour change, so the active
                                    item is not signalled by colour alone. */}
                                <span
                                    aria-hidden="true"
                                    className={cn(
                                        'bg-brand-600 absolute top-0 h-0.5 w-8 rounded-b-full',
                                        isActive ? 'opacity-100' : 'opacity-0',
                                    )}
                                />
                                <Icon
                                    className={cn('size-5 shrink-0', isActive && 'stroke-[2.5]')}
                                />
                                <span className="max-w-full truncate leading-none">{label}</span>
                            </>
                        )}
                    </NavLink>
                ))}
            </div>
        </nav>
    );
}
