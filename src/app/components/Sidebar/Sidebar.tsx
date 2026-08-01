import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink } from 'react-router';

import { UserMenu } from '@app/components';
import { navItems } from '@app/configs/navigation';
import logo from '@assets/logo.svg';

export function Sidebar() {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <>
            {isExpanded && (
                <div
                    aria-hidden="true"
                    onClick={() => setIsExpanded(false)}
                    className="fixed inset-0 z-10 bg-black/50 md:hidden"
                />
            )}
            <aside
                className={`fixed inset-y-0 left-0 z-20 flex ${isExpanded ? 'w-72' : 'w-16'} border-border bg-muted shrink-0 flex-col gap-1 overflow-hidden border-r px-2 py-4 transition-all md:static md:w-64 md:px-4`}
            >
                <div className="mb-4 flex shrink-0 items-center justify-between gap-2 px-2">
                    <Link
                        to="/"
                        className={`min-w-0 items-center gap-2 ${isExpanded ? 'flex' : 'hidden'} md:flex`}
                    >
                        <img src={logo} alt="" className="size-8 shrink-0" />
                        <span className="font-display text-brand-600 text-lg font-semibold whitespace-nowrap">
                            Expense Splitter
                        </span>
                    </Link>
                    <button
                        type="button"
                        aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
                        onClick={() => setIsExpanded((current) => !current)}
                        className="text-muted-foreground hover:bg-border flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md md:hidden"
                    >
                        {isExpanded ? <X className="size-6" /> : <Menu className="size-6" />}
                    </button>
                </div>
                <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
                    {navItems.map(({ to, label, icon: Icon }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={to === '/'}
                            onClick={() => setIsExpanded(false)}
                            className={({ isActive }) =>
                                `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors md:justify-start ${
                                    isExpanded ? '' : 'justify-center'
                                } ${
                                    isActive
                                        ? 'bg-border text-brand-600'
                                        : 'text-muted-foreground hover:bg-border hover:text-surface-foreground'
                                }`
                            }
                        >
                            <Icon className="size-4 shrink-0" />
                            <span className={`${isExpanded ? 'inline' : 'hidden'} md:inline`}>
                                {label}
                            </span>
                        </NavLink>
                    ))}
                </nav>
                <div
                    className={`shrink-0 ${isExpanded ? 'border-border mt-1 border-t pt-4' : ''} md:border-border md:mt-1 md:border-t md:pt-4`}
                >
                    <UserMenu expanded={isExpanded} />
                </div>
            </aside>
        </>
    );
}
