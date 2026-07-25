import { Menu } from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink } from 'react-router';
import logo from '../../assets/logo.svg';
import { navItems } from './navigation';
import { UserMenu } from './UserMenu';

export function Sidebar() {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <aside
            className={`flex ${isExpanded ? 'w-64' : 'w-16'} shrink-0 flex-col gap-1 border-r border-border bg-muted px-2 py-4 transition-all md:w-64 md:px-4`}
        >
            <div className="mb-4 flex items-center gap-2 px-2">
                <Link to="/" className="hidden items-center gap-2 md:flex">
                    <img src={logo} alt="" className="size-8" />
                    <span className="font-display text-lg font-semibold text-brand-600">
                        Expense Splitter
                    </span>
                </Link>
                <button
                    type="button"
                    aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
                    onClick={() => setIsExpanded((current) => !current)}
                    className="flex items-center justify-center rounded-md p-1 text-muted-foreground hover:bg-border md:hidden"
                >
                    <Menu className="size-6" />
                </button>
            </div>
            <nav className="flex flex-1 flex-col gap-1">
                {navItems.map(({ to, label, icon: Icon }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={to === '/'}
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
    );
}
