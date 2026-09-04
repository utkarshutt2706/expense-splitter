import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { usePwaInstallPrompt } from './usePwaInstallPrompt';

function mockDevice(userAgent: string, standalone = false, maxTouchPoints = 0) {
    vi.stubGlobal('navigator', { ...window.navigator, userAgent, maxTouchPoints });
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: standalone } as MediaQueryList);
}

function installEvent(outcome: 'accepted' | 'dismissed') {
    const event = new Event('beforeinstallprompt', { cancelable: true });
    const prompt = vi.fn().mockResolvedValue(undefined);
    Object.assign(event, {
        prompt,
        userChoice: Promise.resolve({ outcome, platform: 'web' }),
    });
    return { event, prompt };
}

describe('usePwaInstallPrompt', () => {
    beforeEach(() => {
        sessionStorage.clear();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it.each([
        ['Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)', 0, 'ios'],
        ['Mozilla/5.0 (Macintosh; Intel Mac OS X)', 2, 'ios'],
        ['Mozilla/5.0 (Linux; Android 15; Pixel 9)', 0, 'android'],
        ['Mozilla/5.0 (X11; Linux x86_64)', 0, null],
    ] as const)('detects the install method for the current device', (agent, touches, method) => {
        mockDevice(agent, false, touches);

        const { result } = renderHook(() => usePwaInstallPrompt());

        expect(result.current.method).toBe(method);
        expect(result.current.isVisible).toBe(method !== null);
    });

    it('stays hidden when the app is already running standalone', () => {
        mockDevice('Mozilla/5.0 (Linux; Android 15)', true);

        const { result } = renderHook(() => usePwaInstallPrompt());

        expect(result.current).toMatchObject({
            method: null,
            isVisible: false,
            isNativeInstallAvailable: false,
        });
    });

    it('respects a dismissal stored for the browser session', () => {
        sessionStorage.setItem('pwa-install-suggestion-dismissed', 'true');
        mockDevice('Mozilla/5.0 (Linux; Android 15)');

        const { result } = renderHook(() => usePwaInstallPrompt());

        expect(result.current.method).toBe('android');
        expect(result.current.isVisible).toBe(false);
    });

    it('persists explicit dismissal and automatically dismisses after ten seconds', () => {
        vi.useFakeTimers();
        mockDevice('Mozilla/5.0 (Linux; Android 15)');
        const first = renderHook(() => usePwaInstallPrompt());

        act(() => first.result.current.dismiss());

        expect(first.result.current.isVisible).toBe(false);
        expect(sessionStorage.getItem('pwa-install-suggestion-dismissed')).toBe('true');
        first.unmount();

        sessionStorage.clear();
        const second = renderHook(() => usePwaInstallPrompt());
        act(() => vi.advanceTimersByTime(9_999));
        expect(second.result.current.isVisible).toBe(true);
        act(() => vi.advanceTimersByTime(1));
        expect(second.result.current.isVisible).toBe(false);
        expect(sessionStorage.getItem('pwa-install-suggestion-dismissed')).toBe('true');
    });

    it('captures the native prompt and clears the suggestion after accepted installation', async () => {
        mockDevice('Mozilla/5.0 (X11; Linux x86_64)');
        const { event, prompt } = installEvent('accepted');
        const { result } = renderHook(() => usePwaInstallPrompt());

        act(() => window.dispatchEvent(event));
        expect(event.defaultPrevented).toBe(true);
        expect(result.current).toMatchObject({
            method: 'android',
            isVisible: true,
            isNativeInstallAvailable: true,
        });

        await act(() => result.current.install());

        expect(prompt).toHaveBeenCalledOnce();
        expect(result.current).toMatchObject({
            method: null,
            isVisible: false,
            isNativeInstallAvailable: false,
        });
    });

    it('retains Android instructions after a dismissed native prompt', async () => {
        mockDevice('Mozilla/5.0 (Linux; Android 15)');
        const { event } = installEvent('dismissed');
        const { result } = renderHook(() => usePwaInstallPrompt());

        act(() => window.dispatchEvent(event));
        await act(() => result.current.install());

        expect(result.current).toMatchObject({
            method: 'android',
            isVisible: true,
            isNativeInstallAvailable: false,
        });
    });

    it('clears state when the browser reports a completed installation', async () => {
        mockDevice('Mozilla/5.0 (Linux; Android 15)');
        const { event } = installEvent('dismissed');
        const { result } = renderHook(() => usePwaInstallPrompt());
        act(() => window.dispatchEvent(event));

        act(() => window.dispatchEvent(new Event('appinstalled')));

        await waitFor(() => expect(result.current.method).toBeNull());
        expect(result.current.isNativeInstallAvailable).toBe(false);
    });

    it('does nothing when installation is requested before a native prompt exists', async () => {
        mockDevice('Mozilla/5.0 (Linux; Android 15)');
        const { result } = renderHook(() => usePwaInstallPrompt());

        await act(() => result.current.install());

        expect(result.current.isNativeInstallAvailable).toBe(false);
        expect(result.current.method).toBe('android');
    });
});
