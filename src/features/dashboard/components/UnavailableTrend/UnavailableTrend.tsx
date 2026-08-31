export function UnavailableTrend() {
    return (
        <section className="border-border bg-muted/40 rounded-2xl border p-5 md:p-6">
            <h2 className="text-xl font-semibold">Daily trend unavailable</h2>
            <p className="text-muted-foreground mt-1 text-sm">
                Refresh after the dashboard server has been updated.
            </p>
        </section>
    );
}
