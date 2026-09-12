import { waitFor } from '@testing-library/react';
import { createBrowserRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '@app/stores';
import { installAuthenticatedGroupHistory, installGroupRootHistory } from './groupRootHistory';

let router: ReturnType<typeof createBrowserRouter>;
let uninstall: () => void;

function start(path = '/groups', basename = '/') {
    window.history.replaceState({ idx: 0 }, '', '/outside');
    window.history.pushState({ idx: 1 }, '', path);
    router = createBrowserRouter([{ path: '*', element: null }], { basename });
    uninstall = installGroupRootHistory(router, () => true);
}

async function at(path: string, index: number) {
    await waitFor(() => {
        expect(router.state.location.pathname + router.state.location.search).toBe(path);
        expect(window.history.state.idx).toBe(index);
    });
    // Allow the subscription's queued reconciliation to finish as well.
    await Promise.resolve();
}

async function visit(path: string, index: number) {
    await router.navigate(path);
    await at(path, index);
}

async function back(path: string, index: number) {
    window.history.back();
    await at(path, index);
}

afterEach(() => {
    uninstall?.();
    router?.dispose();
    useAuthStore.setState({ currentUserId: null });
    vi.restoreAllMocks();
});

describe('Groups-root browser history', () => {
    it('returns to Groups after repeated tab switches, then leaves the app history', async () => {
        start();
        await at('/groups', 1);
        for (const path of ['/dashboard', '/friends', '/analytics', '/activity', '/settings']) {
            await visit(path, 2);
        }
        await back('/groups', 1);
        await back('/outside', 0);
    });

    it('preserves Back through group pages until Groups, then leaves', async () => {
        start();
        await at('/groups', 1);
        await visit('/groups/trip', 2);
        await visit('/groups/trip/expenses/lunch', 3);
        await visit('/groups/trip/expenses/lunch/edit', 4);
        await back('/groups/trip/expenses/lunch', 3);
        await back('/groups/trip', 2);
        await back('/groups', 1);
        await back('/outside', 0);
    });

    it('discards the old group stack when switching to a tab, preserving its query', async () => {
        start();
        await at('/groups', 1);
        await visit('/groups/trip', 2);
        await visit('/groups/trip/settings', 3);
        await visit('/analytics?groupId=trip', 2);
        await back('/groups', 1);
        await back('/outside', 0);
    });

    it('returns to the original Groups entry when its tab or home link is clicked', async () => {
        start();
        await at('/groups', 1);
        await visit('/groups/trip', 2);
        await visit('/groups/trip/balance', 3);
        await visit('/groups', 1);
        await back('/outside', 0);
    });

    it('does not accumulate entries when the active tab is clicked repeatedly', async () => {
        start();
        await at('/groups', 1);
        await visit('/groups', 1);
        await visit('/friends', 2);
        await visit('/friends', 2);
        await back('/groups', 1);
        await back('/outside', 0);
    });

    it.each(['/analytics?groupId=trip', '/groups/trip/expenses/lunch/edit'])(
        'places Groups beneath the direct link %s',
        async (path) => {
            start(path);
            await at(path, 2);
            await back('/groups', 1);
            await back('/outside', 0);
        },
    );

    it('preserves its root after a router restart, as on refresh', async () => {
        start();
        await at('/groups', 1);
        await visit('/groups/trip', 2);
        await visit('/groups/trip/settings', 3);
        uninstall();
        router.dispose();
        router = createBrowserRouter([{ path: '*', element: null }]);
        uninstall = installGroupRootHistory(router, () => true);
        await at('/groups/trip/settings', 3);
        await visit('/friends', 2);
        await back('/groups', 1);
        await back('/outside', 0);
    });

    it('starts a group stack above Groups when following a link from another tab', async () => {
        start();
        await at('/groups', 1);
        await visit('/dashboard', 2);
        await visit('/groups/trip/balance', 2);
        await back('/groups', 1);
        await back('/outside', 0);
    });

    it('preserves replacement navigation within a group', async () => {
        start();
        await at('/groups', 1);
        await visit('/groups/trip', 2);
        await visit('/groups/trip/expenses/new', 3);
        await router.navigate('/groups/trip/expenses/lunch', { replace: true });
        await at('/groups/trip/expenses/lunch', 3);
        await back('/groups/trip', 2);
        await back('/groups', 1);
    });

    it('retains route state and hash when moving a tab above Groups', async () => {
        start();
        await at('/groups', 1);
        await visit('/friends', 2);
        await router.navigate('/analytics?groupId=trip#shares', { state: { source: 'group' } });
        await at('/analytics?groupId=trip', 2);
        expect(router.state.location.hash).toBe('#shares');
        expect(router.state.location.state).toEqual({ source: 'group' });
    });

    it('respects a deployment basename', async () => {
        start('/splitter/analytics?groupId=trip', '/splitter/');
        await at('/splitter/analytics?groupId=trip', 2);
        await back('/splitter/groups', 1);
        await back('/outside', 0);
    });

    it('does not add Groups beneath public routes', async () => {
        start('/login');
        await at('/login', 1);
        await back('/outside', 0);
    });

    it('allows Forward to revisit a tab after returning to Groups', async () => {
        start();
        await at('/groups', 1);
        await visit('/friends', 2);
        await visit('/analytics', 2);
        await back('/groups', 1);
        window.history.forward();
        await at('/analytics', 2);
        await back('/groups', 1);
        await back('/outside', 0);
    });

    it('uses the last destination when tab clicks arrive while returning to Groups', async () => {
        start();
        await at('/groups', 1);
        await visit('/dashboard', 2);
        await router.navigate('/friends');
        await router.navigate('/analytics');
        await at('/analytics', 2);
        await back('/groups', 1);
        await back('/outside', 0);
    });

    it('restores Groups underneath a navigation that replaces the root', async () => {
        start();
        await at('/groups', 1);
        await router.navigate('/dashboard', { replace: true });
        await at('/dashboard', 2);
        await back('/groups', 1);
        await back('/outside', 0);
    });

    it('waits for authentication before changing a direct-link history', async () => {
        window.history.replaceState({ idx: 0 }, '', '/outside');
        window.history.pushState({ idx: 1 }, '', '/analytics');
        router = createBrowserRouter([{ path: '*', element: null }]);
        uninstall = installGroupRootHistory(router, () => false);
        await at('/analytics', 1);
        uninstall();
        uninstall = installGroupRootHistory(router, () => true);
        await at('/analytics', 2);
        await back('/groups', 1);
        await back('/outside', 0);
    });

    it('does not run queued startup work after being uninstalled', async () => {
        start('/analytics');
        const navigate = vi.spyOn(router, 'navigate');
        uninstall();
        await Promise.resolve();
        expect(navigate).not.toHaveBeenCalled();
        await at('/analytics', 1);
    });

    it('leaves history alone when a browser entry has no router index', async () => {
        start('/analytics');
        window.history.replaceState(null, '');
        const navigate = vi.spyOn(router, 'navigate');
        await Promise.resolve();
        expect(navigate).not.toHaveBeenCalled();
        expect(window.history.state).toBeNull();
        expect(router.state.location.pathname).toBe('/analytics');
    });

    it('defaults to the domain root when the router has no explicit basename', async () => {
        start();
        uninstall();
        const withoutBasename = new Proxy(router, {
            get(target, key, receiver) {
                return key === 'basename' ? undefined : Reflect.get(target, key, receiver);
            },
        });
        uninstall = installGroupRootHistory(withoutBasename, () => true);
        await at('/groups', 1);
        await visit('/analytics', 2);
        await back('/groups', 1);
        await back('/outside', 0);
    });

    it('keeps the requested tab when an interrupted traversal lands on an intermediate entry', async () => {
        start();
        await at('/groups', 1);
        await visit('/dashboard', 2);
        // Simulate a traversal interrupted by another Back action before it
        // reaches Groups. The intermediate dashboard must not become the tab.
        vi.spyOn(window.history, 'go').mockImplementationOnce(() => window.history.go(-1));
        await visit('/analytics', 2);
        await back('/groups', 1);
        await back('/outside', 0);
    });
});

describe('authenticated history lifecycle', () => {
    it('applies the direct-link policy once the session is restored', async () => {
        start('/analytics');
        uninstall();
        uninstall = installAuthenticatedGroupHistory(router);
        await at('/analytics', 1);
        useAuthStore.setState({ currentUserId: 'restored-user' });
        await at('/analytics', 2);
        await back('/groups', 1);
        await back('/outside', 0);
    });

    it('keeps the active history subscription for token changes within the same account', async () => {
        start();
        uninstall();
        useAuthStore.setState({ currentUserId: 'user' });
        uninstall = installAuthenticatedGroupHistory(router);
        await at('/groups', 1);
        const subscribe = vi.spyOn(router, 'subscribe');
        useAuthStore.setState({ accessToken: 'refreshed-token' });
        expect(subscribe).not.toHaveBeenCalled();
        await visit('/analytics', 2);
        await back('/groups', 1);
    });

    it('removes both navigation and authentication subscriptions on hot reload', async () => {
        start();
        uninstall();
        useAuthStore.setState({ currentUserId: 'user' });
        const hot = { dispose: vi.fn() };
        uninstall = installAuthenticatedGroupHistory(router, hot);
        await at('/groups', 1);
        await visit('/dashboard', 2);
        expect(hot.dispose).toHaveBeenCalledOnce();
        expect(hot.dispose).toHaveBeenCalledWith(uninstall);
        hot.dispose.mock.calls[0]![0]();
        const subscribe = vi.spyOn(router, 'subscribe');
        useAuthStore.setState({ currentUserId: 'another-user' });
        expect(subscribe).not.toHaveBeenCalled();
        await visit('/friends', 3);
        await back('/dashboard', 2);
    });
});
