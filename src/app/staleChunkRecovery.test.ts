import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const reload = vi.fn();

// Each test needs a fresh module: the "already reloaded" guard is module state
// that would otherwise leak between cases.
async function loadModule() {
    vi.resetModules();
    return import('./staleChunkRecovery');
}

function dispatchPreloadError() {
    const event = new Event('vite:preloadError', { cancelable: true });
    window.dispatchEvent(event);
    return event;
}

beforeEach(() => {
    reload.mockClear();
    sessionStorage.clear();
    Object.defineProperty(window, 'location', {
        configurable: true,
        value: { ...window.location, reload },
    });
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe('reloadForStaleChunk', () => {
    it('reloads so the tab picks up the current build', async () => {
        const { reloadForStaleChunk } = await loadModule();

        expect(reloadForStaleChunk()).toBe(true);
        expect(reload).toHaveBeenCalledTimes(1);
    });

    it('reloads only once however many imports fail together', async () => {
        const { reloadForStaleChunk } = await loadModule();

        reloadForStaleChunk();
        expect(reloadForStaleChunk()).toBe(false);
        expect(reload).toHaveBeenCalledTimes(1);
    });

    it('does not reload again after a reload that did not help', async () => {
        const { reloadForStaleChunk } = await loadModule();
        reloadForStaleChunk(1_000);

        // The reload happened, so this is a fresh page — the in-memory guard is
        // gone but the recorded timestamp is not.
        const afterReload = await loadModule();

        expect(afterReload.reloadForStaleChunk(2_000)).toBe(false);
        expect(reload).toHaveBeenCalledTimes(1);
    });

    it('recovers again once the retry window has passed', async () => {
        const { reloadForStaleChunk } = await loadModule();
        reloadForStaleChunk(1_000);

        const later = await loadModule();

        expect(later.reloadForStaleChunk(60_000)).toBe(true);
        expect(reload).toHaveBeenCalledTimes(2);
    });

    it('still recovers when storage is unavailable, without looping', async () => {
        vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
            throw new Error('storage blocked');
        });
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new Error('storage blocked');
        });
        const { reloadForStaleChunk } = await loadModule();

        expect(reloadForStaleChunk()).toBe(true);
        expect(reloadForStaleChunk()).toBe(false);
        expect(reload).toHaveBeenCalledTimes(1);
    });
});

describe('registerStaleChunkRecovery', () => {
    it('recovers when Vite reports a chunk it could not load', async () => {
        const { registerStaleChunkRecovery } = await loadModule();
        registerStaleChunkRecovery();

        const event = dispatchPreloadError();

        expect(reload).toHaveBeenCalledTimes(1);
        // Cancelled, so Vite does not rethrow into the route error boundary and
        // flash an error page behind the reload.
        expect(event.defaultPrevented).toBe(true);
    });

    it('lets the error through once recovery has already been tried', async () => {
        const { registerStaleChunkRecovery } = await loadModule();
        registerStaleChunkRecovery();

        dispatchPreloadError();
        const second = dispatchPreloadError();

        expect(reload).toHaveBeenCalledTimes(1);
        // Not cancelled, so the failure surfaces instead of being swallowed.
        expect(second.defaultPrevented).toBe(false);
    });
});
