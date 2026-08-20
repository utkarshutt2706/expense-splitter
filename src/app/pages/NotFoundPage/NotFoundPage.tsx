import { AlertTriangle } from 'lucide-react';
import { Link } from 'react-router';

// The catch-all "*" route's plain element (a genuine route match, not an
// error) — deliberately doesn't call useRouteError, unlike ErrorPage.
export function NotFoundPage() {
    return (
        <div className="flex h-full flex-col items-center justify-center gap-3 py-16 text-center">
            <AlertTriangle className="text-muted-foreground size-10" />
            <h1 className="font-display text-surface-foreground text-2xl font-medium">
                Page not found
            </h1>
            <p className="text-muted-foreground max-w-sm text-sm">
                The page you're looking for doesn't exist or may have moved.
            </p>
            <Link
                to="/groups"
                className="bg-brand-600 hover:bg-brand-700 mt-2 inline-flex cursor-pointer items-center gap-1 rounded-md px-4 py-2 text-sm font-medium text-white"
            >
                Back to groups
            </Link>
        </div>
    );
}
