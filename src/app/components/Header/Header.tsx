import { useLocation, useParams } from 'react-router';

import { pageTitles } from '@app/configs/navigation';
import { useGroup } from '@features/groups';

export function Header() {
    const { pathname } = useLocation();
    const { groupId } = useParams<{ groupId?: string }>();
    const { data: group } = useGroup(groupId ?? '');
    const title = groupId ? (group?.name ?? 'Group Detail') : (pageTitles[pathname] ?? '');

    return (
        <header className="border-border bg-surface flex items-center border-b px-4 py-4 md:px-6">
            <h1 className="text-surface-foreground font-display text-xl font-medium">{title}</h1>
        </header>
    );
}
