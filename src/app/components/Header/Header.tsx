import { useLocation, useParams } from 'react-router';

import { pageTitles } from '@app/configs/navigation';
import { useGroup } from '@features/groups';

export function Header() {
    const { pathname } = useLocation();
    const { groupId } = useParams<{ groupId?: string }>();
    const { data: group } = useGroup(groupId ?? '');
    const title = groupId ? (group?.name ?? 'Group Detail') : (pageTitles[pathname] ?? '');

    return (
        <header className="flex items-center border-b border-border bg-surface px-4 md:px-6 py-4">
            <h1 className="font-display text-xl font-medium text-surface-foreground">{title}</h1>
        </header>
    );
}
