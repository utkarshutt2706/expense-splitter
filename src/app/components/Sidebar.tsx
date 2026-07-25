import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink } from 'react-router';
import logo from '../../assets/logo.svg';
import { navItems } from './navigation';
import { UserMenu } from './UserMenu';

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
                className={`fixed inset-y-0 left-0 z-20 flex ${isExpanded ? 'w-72' : 'w-16'} shrink-0 flex-col gap-1 border-r border-border bg-muted px-2 py-4 transition-all md:static md:w-64 md:px-4`}
            >
                <div className="mb-4 flex items-center justify-between gap-2 px-2">
                    <Link
                        to="/"
                        className={`min-w-0 items-center gap-2 ${isExpanded ? 'flex' : 'hidden'} md:flex`}
                    >
                        <img src={logo} alt="" className="size-8 shrink-0" />
                        <span className="font-display text-lg font-semibold whitespace-nowrap text-brand-600">
                            Expense Splitter
                        </span>
                    </Link>
                    <button
                        type="button"
                        aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
                        onClick={() => setIsExpanded((current) => !current)}
                        className="flex size-8 shrink-0 items-center justify-center rounded-md cursor-pointer text-muted-foreground hover:bg-border md:hidden"
                    >
                        {isExpanded ? <X className="size-6" /> : <Menu className="size-6" />}
                    </button>
                </div>
                <nav className="flex flex-1 flex-col gap-1">
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
                    className={`${isExpanded ? 'mt-1 border-t border-border pt-3' : ''} md:mt-1 md:border-t md:border-border md:pt-3`}
                >
                    <UserMenu expanded={isExpanded} />
                </div>
            </aside>
        </>
    );
}
