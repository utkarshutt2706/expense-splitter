import { Download, Share, SquarePlus, X } from 'lucide-react';
import type { ReactNode } from 'react';

import logo from '@assets/logo.svg';
import { usePwaInstallPrompt } from '@app/hooks/usePwaInstallPrompt';

import styles from './PwaInstallPrompt.module.css';

export function PwaInstallPrompt() {
    const { dismiss, install, isNativeInstallAvailable, isVisible, method } = usePwaInstallPrompt();

    if (!isVisible) return null;

    let installAction: ReactNode = (
        <p className="bg-muted mt-4 rounded-xl px-3 py-2.5 text-sm leading-relaxed">
            Open your browser menu and choose <span className="font-medium">Install app</span> or{' '}
            <span className="font-medium">Add to Home screen</span>.
        </p>
    );
    if (method === 'ios') {
        installAction = (
            <div className="bg-muted mt-4 flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm">
                <Share aria-hidden="true" className="text-brand-600 size-4 shrink-0" />
                <span>Tap Share, then</span>
                <SquarePlus aria-hidden="true" className="text-brand-600 size-4 shrink-0" />
                <span className="font-medium">Add to Home Screen</span>
            </div>
        );
    } else if (isNativeInstallAvailable) {
        installAction = (
            <button
                type="button"
                onClick={() => void install()}
                className="bg-brand-600 hover:bg-brand-700 relative mt-4 flex w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
            >
                <span className={styles.installCountdown} aria-hidden="true" />
                <span className="relative flex items-center gap-2">
                    <Download className="size-4" /> Install app
                </span>
            </button>
        );
    }

    return (
        <aside
            aria-label="Install Expense Splitter"
            className="border-border bg-surface bottom-nav-clearance fixed right-3 left-3 z-50 mx-auto max-w-md rounded-2xl border p-4 shadow-2xl sm:right-5 sm:left-auto md:bottom-5"
        >
            <button
                type="button"
                aria-label="Dismiss install suggestion"
                onClick={dismiss}
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

            {installAction}
        </aside>
    );
}
