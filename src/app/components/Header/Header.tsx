import { Link, useLocation, useParams } from 'react-router';

import { UserMenu } from '@app/components';
import { pageTitles } from '@app/configs/navigation';
import { useGroup } from '@features/groups';
import logo from '@assets/logo.svg';

/**
 * The page-title bar. From md up the Sidebar carries the brand and the user
 * menu, so this stays the plain title row it has always been; below md there is
 * no sidebar, so the brand and the user menu ride along here instead.
 */
export function Header() {
    const { pathname } = useLocation();
    const { groupId } = useParams<{ groupId?: string }>();
    const { data: group } = useGroup(groupId ?? '');
    const title = groupId ? (group?.name ?? 'Group Detail') : (pageTitles[pathname] ?? '');

    return (
        <header className="border-border bg-surface flex shrink-0 items-center gap-3 border-b px-4 py-3 md:px-6 md:py-4">
            <Link
                to="/"
                aria-label="Expense Splitter home"
                className="focus-visible:ring-brand-500 shrink-0 rounded-md outline-none focus-visible:ring-2 md:hidden"
            >
                <img src={logo} alt="" className="size-8" />
            </Link>
            <h1 className="text-surface-foreground min-w-0 flex-1 truncate text-xl font-medium">
                {title}
            </h1>
            <div className="shrink-0 md:hidden">
                <UserMenu expanded={false} side="bottom" align="end" />
            </div>
        </header>
    );
}
