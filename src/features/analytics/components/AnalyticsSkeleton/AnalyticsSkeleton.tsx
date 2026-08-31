export function AnalyticsSkeleton() {
    return (
        <output aria-label="Loading analytics" className="mx-auto block max-w-7xl space-y-6">
            <div className="bg-muted h-12 w-72 animate-pulse rounded-lg" />
            <div className="bg-muted h-28 animate-pulse rounded-2xl" />
            <div className="grid gap-6">
                <div className="bg-muted h-96 animate-pulse rounded-2xl" />
                <div className="bg-muted h-96 animate-pulse rounded-2xl" />
            </div>
        </output>
    );
}
