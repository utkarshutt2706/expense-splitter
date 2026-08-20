// Vite dispatches vite:preloadError when a dynamic import cannot be loaded. In
// production that almost always means the chunk is gone rather than broken: the
// tab is running an older build, and a deploy has replaced the hashed files the
// in-memory index.html points at. GitHub Pages answers the missing file with
// 404.html, so the browser receives HTML where it asked for a module — which is
// why the message reads "Failed to fetch dynamically imported module".
//
// A reload fetches the current index.html and with it the current chunk names,
// which is why the error clears when a user refreshes by hand. Doing that
// automatically is safe at this exact moment: the failure happens while
// navigating to another route, so there is no in-progress screen to lose.

const LAST_RELOAD_KEY = 'stale-chunk-reload-at';

// Long enough to cover the reload itself, short enough that an unrelated
// failure later in the session still gets its own attempt.
const RETRY_WINDOW_MS = 10_000;

// Guards against several imports failing at once; sessionStorage guards against
// looping across the reload. Both are needed: the flag cannot survive a reload,
// and storage can be unavailable.
let reloadedThisPage = false;

function lastReloadAt(): number {
    try {
        return Number(window.sessionStorage.getItem(LAST_RELOAD_KEY)) || 0;
    } catch {
        // Storage throws when the browser blocks it; treat that as "not tried".
        return 0;
    }
}

function rememberReload(at: number): void {
    try {
        window.sessionStorage.setItem(LAST_RELOAD_KEY, String(at));
    } catch {
        // Without storage the in-memory flag still stops a loop within this
        // page, and a second failure after reloading surfaces as an error.
    }
}

/**
 * Reloads so the tab picks up the current build. Returns false when a reload
 * was already attempted moments ago, so a chunk that is genuinely missing
 * surfaces as an error rather than putting the tab in a reload loop.
 */
export function reloadForStaleChunk(now: number = Date.now()): boolean {
    if (reloadedThisPage) return false;

    // Absence has to be checked separately: a stored 0 would otherwise read as
    // "reloaded at the epoch", which is inside the window for any small clock.
    const last = lastReloadAt();
    if (last > 0 && now - last < RETRY_WINDOW_MS) return false;

    reloadedThisPage = true;
    rememberReload(now);
    window.location.reload();
    return true;
}

export function registerStaleChunkRecovery(): void {
    window.addEventListener('vite:preloadError', (event) => {
        // Vite rethrows unless the event is cancelled, which would surface the
        // route error boundary behind the reload that is already under way.
        if (reloadForStaleChunk()) event.preventDefault();
    });
}
