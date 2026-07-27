import { useLocation } from 'react-router';

import { pageTitles } from '@app/configs/navigation';

export function Header() {
    const { pathname } = useLocation();
    const title = pageTitles[pathname] ?? '';

    return (
        <header className="flex items-center border-b border-border bg-surface px-4 md:px-6 py-4">
            <h1 className="font-display text-xl font-medium text-surface-foreground">{title}</h1>
        </header>
    );
}
