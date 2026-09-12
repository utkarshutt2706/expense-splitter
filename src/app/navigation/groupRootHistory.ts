import type { createBrowserRouter } from 'react-router';

import { pageTitles } from '@app/configs/navigation';
import { useAuthStore } from '@app/stores';

type AppRouter = ReturnType<typeof createBrowserRouter>;
type Destination = {
    pathname: string;
    search: string;
    hash: string;
    state: unknown;
};

const ROOT_INDEX = 'expenseSplitterGroupRootIndex';

/** Reinstall after session restoration or account changes, with paired cleanup. */
export function installAuthenticatedGroupHistory(
    router: AppRouter,
    hot?: Pick<NonNullable<ImportMeta['hot']>, 'dispose'>,
) {
    const installHistory = () =>
        installGroupRootHistory(router, () => useAuthStore.getState().currentUserId !== null);
    let uninstallHistory = installHistory();
    const unsubscribeAuth = useAuthStore.subscribe((state, previous) => {
        if (state.currentUserId === previous.currentUserId) return;
        uninstallHistory();
        uninstallHistory = installHistory();
    });

    const dispose = () => {
        uninstallHistory();
        unsubscribeAuth();
    };
    hot?.dispose(dispose);
    return dispose;
}

/**
 * Keep one Groups entry below the current tab or group navigation stack.
 * React Router's history index lets us return to that entry before pushing a
 * different tab, discarding the old branch without trapping Back at Groups.
 * Store the root index on each browser entry so refreshing preserves the stack.
 */
export function installGroupRootHistory(
    router: AppRouter,
    isAuthenticated: () => boolean,
    browser: Window = window,
) {
    let rootIndex: number | undefined;
    let pending: Destination | undefined;
    let previousPath: string | undefined;
    let processedKey: string | undefined;
    let disposed = false;

    const basename = (router.basename ?? '/').replace(/\/$/, '');
    const isGroupPage = (path: string) => path === '/groups' || path.startsWith('/groups/');

    function reconcile() {
        if (disposed || !router.state.initialized || router.state.navigation.state !== 'idle') {
            return;
        }

        const { location, historyAction } = router.state;
        if (location.key === processedKey) return;
        processedKey = location.key;

        const pathname =
            (location.pathname.slice(basename.length) || '/').replace(/\/$/, '') || '/';
        if (
            !isAuthenticated() ||
            (!isGroupPage(pathname) && !Object.hasOwn(pageTitles, pathname))
        ) {
            rootIndex = undefined;
            pending = undefined;
            previousPath = undefined;
            return;
        }

        const entry = browser.history.state;
        const index: unknown = entry?.idx;
        if (typeof index !== 'number') return;

        const savedRoot: unknown = entry?.[ROOT_INDEX];
        if (rootIndex === undefined) {
            rootIndex =
                typeof savedRoot === 'number' && savedRoot >= 0 && savedRoot <= index
                    ? savedRoot
                    : index;
        }

        const destination = { ...location, pathname };
        const fromPath = previousPath;
        previousPath = pathname;

        if (pending) {
            if (index === rootIndex && pathname === '/groups') {
                const target = pending;
                pending = undefined;
                if (target.pathname !== '/groups') {
                    void router.navigate(target, { state: target.state });
                }
            } else {
                // A push can cancel an in-flight history traversal. Keep the
                // latest clicked destination and retry from the current entry.
                // An intermediate POP must not overwrite that destination.
                if (historyAction !== 'POP') pending = destination;
                void router.navigate(rootIndex - index);
            }
            return;
        }

        // A direct link (or a replacement of the root) needs a Groups entry
        // underneath it. Keep the full URL and route state on the destination.
        if (index <= rootIndex && pathname !== '/groups') {
            rootIndex = index;
            pending = destination;
            void router.navigate('/groups', { replace: true });
            return;
        }

        browser.history.replaceState({ ...entry, [ROOT_INDEX]: rootIndex }, '');

        const returningToGroups = pathname === '/groups' && index > rootIndex;
        const switchingTabs = !isGroupPage(pathname) && index > rootIndex + 1;
        const enteringGroupFromTab =
            historyAction === 'PUSH' &&
            isGroupPage(pathname) &&
            fromPath !== undefined &&
            !isGroupPage(fromPath) &&
            index > rootIndex + 1;

        if (returningToGroups || switchingTabs || enteringGroupFromTab) {
            pending = destination;
            void router.navigate(rootIndex - index);
        }
    }

    // Run after the router has committed its browser history entry, including
    // on startup. No popstate/beforeunload handler intercepts leaving Groups.
    const unsubscribe = router.subscribe(() => queueMicrotask(reconcile));
    queueMicrotask(reconcile);

    return () => {
        disposed = true;
        unsubscribe();
    };
}
