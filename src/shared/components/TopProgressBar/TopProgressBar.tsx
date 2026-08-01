export function TopProgressBar() {
    // A visible native <progress> without a value renders the browser's own
    // indeterminate animation, which can't be restyled to match the custom fill
    // below — so the real <progress> stays for accessible semantics, visually
    // hidden, while the fill is a decorative sibling.
    return (
        <div className="fixed inset-x-0 top-0 z-50 h-1">
            <progress className="sr-only" aria-label="Loading" />
            <div
                aria-hidden="true"
                className="animate-progress-fill bg-brand-500 h-full origin-left rounded-full"
            />
        </div>
    );
}
