import { useCallback, useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
    readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
    prompt(): Promise<void>;
}

export type PwaInstallMethod = 'android' | 'ios';

const DISMISSED_KEY = 'pwa-install-suggestion-dismissed';
const AUTO_DISMISS_DELAY_MS = 10_000;

function wasDismissed(): boolean {
    try {
        return sessionStorage.getItem(DISMISSED_KEY) === 'true';
    } catch {
        return false;
    }
}

function rememberDismissal(): void {
    try {
        sessionStorage.setItem(DISMISSED_KEY, 'true');
    } catch {
        // In-memory state still hides the prompt when storage is unavailable.
    }
}

function isRunningStandalone() {
    const iosNavigator = navigator as Navigator & { standalone?: boolean };
    return (
        window.matchMedia('(display-mode: standalone)').matches || iosNavigator.standalone === true
    );
}

function mobileInstallMethod(): PwaInstallMethod | null {
    const userAgent = navigator.userAgent;
    const isAppleMobile =
        /iPad|iPhone|iPod/i.test(userAgent) ||
        (/Macintosh/i.test(userAgent) && navigator.maxTouchPoints > 1);
    if (isAppleMobile) return 'ios';
    if (/Android/i.test(userAgent)) return 'android';
    return null;
}

export function usePwaInstallPrompt() {
    const [method, setMethod] = useState<PwaInstallMethod | null>(() =>
        isRunningStandalone() ? null : mobileInstallMethod(),
    );
    const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isDismissed, setIsDismissed] = useState(wasDismissed);

    const dismiss = useCallback(() => {
        rememberDismissal();
        setIsDismissed(true);
    }, []);

    useEffect(() => {
        if (!method || isDismissed) return;
        const dismissTimer = window.setTimeout(dismiss, AUTO_DISMISS_DELAY_MS);
        return () => window.clearTimeout(dismissTimer);
    }, [dismiss, isDismissed, method]);

    useEffect(() => {
        if (isRunningStandalone()) return;
        const handleInstallPrompt = (event: Event) => {
            event.preventDefault();
            setInstallPrompt(event as BeforeInstallPromptEvent);
            setMethod('android');
        };
        const handleInstalled = () => {
            setInstallPrompt(null);
            setMethod(null);
        };
        window.addEventListener('beforeinstallprompt', handleInstallPrompt);
        window.addEventListener('appinstalled', handleInstalled);
        return () => {
            window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
            window.removeEventListener('appinstalled', handleInstalled);
        };
    }, []);

    const install = async () => {
        if (!installPrompt) return;
        let outcome: 'accepted' | 'dismissed';
        try {
            await installPrompt.prompt();
            ({ outcome } = await installPrompt.userChoice);
        } catch {
            // Keep the captured prompt available so the user can try again.
            return;
        }
        setInstallPrompt(null);
        if (outcome === 'accepted') setMethod(null);
    };

    return {
        dismiss,
        install,
        isNativeInstallAvailable: installPrompt !== null,
        isVisible: method !== null && !isDismissed,
        method,
    };
}
