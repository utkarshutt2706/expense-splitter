import { Wallet } from 'lucide-react';
import { Link, NavLink } from 'react-router';
import { navItems } from './navigation';

export function Sidebar() {
    return (
        <aside className="flex w-64 shrink-0 flex-col gap-1 border-r border-border bg-surface p-4">
            <Link to="/" className="mb-4 flex items-center gap-2 px-2">
                <Wallet className="size-6 text-brand-600" />
                <span className="font-display text-lg font-medium text-surface-foreground">
                    Expense Splitter
                </span>
            </Link>
            <nav className="flex flex-col gap-1">
                {navItems.map(({ to, label, icon: Icon }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={to === '/'}
                        className={({ isActive }) =>
                            `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                                isActive
                                    ? 'bg-muted text-brand-600'
                                    : 'text-muted-foreground hover:bg-muted hover:text-surface-foreground'
                            }`
                        }
                    >
                        <Icon className="size-4" />
                        {label}
                    </NavLink>
                ))}
            </nav>
        </aside>
    );
}
