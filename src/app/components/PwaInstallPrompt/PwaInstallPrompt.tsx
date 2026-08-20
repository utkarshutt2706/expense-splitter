import { Download, Share, SquarePlus, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import logo from '@assets/logo.svg';

import styles from './PwaInstallPrompt.module.css';

interface BeforeInstallPromptEvent extends Event {
    readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
    prompt(): Promise<void>;
}

type InstallMethod = 'android' | 'ios';
const DISMISSED_KEY = 'pwa-install-suggestion-dismissed';
const AUTO_DISMISS_SECONDS = 10;
const AUTO_DISMISS_DELAY_MS = AUTO_DISMISS_SECONDS * 1_000;

function isRunningStandalone() {
    const iosNavigator = navigator as Navigator & { standalone?: boolean };
    return (
        window.matchMedia('(display-mode: standalone)').matches || iosNavigator.standalone === true
    );
}

function mobileInstallMethod(): InstallMethod | null {
    const userAgent = navigator.userAgent;
    const isAppleMobile =
        /iPad|iPhone|iPod/i.test(userAgent) ||
        (/Macintosh/i.test(userAgent) && navigator.maxTouchPoints > 1);

    if (isAppleMobile) return 'ios';
    if (/Android/i.test(userAgent)) return 'android';
    return null;
}

export function PwaInstallPrompt() {
    const [method, setMethod] = useState<InstallMethod | null>(() =>
        isRunningStandalone() ? null : mobileInstallMethod(),
    );
    const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isDismissed, setIsDismissed] = useState(
        () => sessionStorage.getItem(DISMISSED_KEY) === 'true',
    );

    useEffect(() => {
        if (!method || isDismissed) return;

        const dismissTimer = window.setTimeout(() => {
            sessionStorage.setItem(DISMISSED_KEY, 'true');
            setIsDismissed(true);
        }, AUTO_DISMISS_DELAY_MS);

        return () => window.clearTimeout(dismissTimer);
    }, [isDismissed, method]);

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

    if (!method || isDismissed) return null;

    const installOnAndroid = async () => {
        if (!installPrompt) return;

        await installPrompt.prompt();
        const { outcome } = await installPrompt.userChoice;
        setInstallPrompt(null);
        if (outcome === 'accepted') setMethod(null);
    };

    return (
        <aside
            aria-label="Install Expense Splitter"
            className="border-border bg-surface fixed right-3 bottom-3 left-3 z-50 mx-auto max-w-md rounded-2xl border p-4 shadow-2xl sm:right-5 sm:bottom-5 sm:left-auto"
        >
            <button
                type="button"
                aria-label="Dismiss install suggestion"
                onClick={() => {
                    sessionStorage.setItem(DISMISSED_KEY, 'true');
                    setIsDismissed(true);
                }}
                className="text-muted-foreground hover:bg-muted absolute top-3 right-3 flex size-8 cursor-pointer items-center justify-center rounded-full"
            >
                <X className="size-4" />
            </button>

            <div className="flex gap-3 pr-8">
                <span className="bg-brand-50 dark:bg-brand-950/40 flex size-11 shrink-0 items-center justify-center rounded-xl">
                    <img src={logo} alt="" className="size-8" />
                </span>
                <div>
                    <h2 className="text-base font-semibold">Keep Expense Splitter handy</h2>
                    <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                        Install the app for quick access from your home screen.
                    </p>
                </div>
            </div>

            {method === 'ios' ? (
                <div className="bg-muted mt-4 flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm">
                    <Share aria-hidden="true" className="text-brand-600 size-4 shrink-0" />
                    <span>Tap Share, then</span>
                    <SquarePlus aria-hidden="true" className="text-brand-600 size-4 shrink-0" />
                    <span className="font-medium">Add to Home Screen</span>
                </div>
            ) : installPrompt ? (
                <button
                    type="button"
                    onClick={() => void installOnAndroid()}
                    className="bg-brand-600 hover:bg-brand-700 relative mt-4 flex w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
                >
                    <span className={styles.installCountdown} aria-hidden="true" />
                    <span className="relative flex items-center gap-2">
                        <Download className="size-4" /> Install app
                    </span>
                </button>
            ) : (
                <p className="bg-muted mt-4 rounded-xl px-3 py-2.5 text-sm leading-relaxed">
                    Open your browser menu and choose{' '}
                    <span className="font-medium">Install app</span> or{' '}
                    <span className="font-medium">Add to Home screen</span>.
                </p>
            )}
        </aside>
    );
}
