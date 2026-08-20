import { AlertTriangle } from 'lucide-react';
import { isRouteErrorResponse, Link, useRouteError } from 'react-router';

// Only ever used as a route's errorElement — useRouteError() only resolves
// meaningfully in that context. The "unmatched URL" case is handled by the
// separate NotFoundPage instead, which never calls this hook.
export function ErrorPage() {
    const error = useRouteError();
    const isNotFound = isRouteErrorResponse(error) && error.status === 404;

    const title = isNotFound ? 'Page not found' : 'Something went wrong';
    const description = isNotFound
        ? "The page you're looking for doesn't exist or may have moved."
        : 'An unexpected error occurred. Try reloading the page.';

    return (
        <div className="flex h-full flex-col items-center justify-center gap-3 py-16 text-center">
            <AlertTriangle className="text-muted-foreground size-10" />
            <h1 className="font-display text-surface-foreground text-2xl font-medium">{title}</h1>
            <p className="text-muted-foreground max-w-sm text-sm">{description}</p>
            {!isNotFound && error instanceof Error && (
                <p className="text-muted-foreground max-w-sm text-xs">{error.message}</p>
            )}
            <Link
                to="/groups"
                className="bg-brand-600 hover:bg-brand-700 mt-2 inline-flex cursor-pointer items-center gap-1 rounded-md px-4 py-2 text-sm font-medium text-white"
            >
                Back to groups
            </Link>
        </div>
    );
}
