import { RefreshCw } from 'lucide-react';

export type DashboardErrorProps = Readonly<{ onRetry: () => void }>;

export function DashboardError({ onRetry }: DashboardErrorProps) {
    return (
        <div className="border-border mx-auto max-w-xl rounded-2xl border p-8 text-center">
            <h1 className="text-2xl font-semibold">We couldn't load your dashboard</h1>
            <p className="text-muted-foreground mt-2 text-sm">
                Your expenses have not been changed. Try loading the summary again.
            </p>
            <button
                type="button"
                onClick={onRetry}
                className="bg-brand-600 hover:bg-brand-700 focus-visible:ring-brand-500 mt-5 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-4 text-sm font-semibold text-white focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
                <RefreshCw className="size-4" />
                Retry
            </button>
        </div>
    );
}
