import { RefreshCw, Server } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';

import logo from '@assets/logo.svg';

const SLOW_RESPONSE_DELAY_MS = 1_500;
const REQUEST_TIMEOUT_MS = 90_000;
const AUTO_RETRY_DELAY_MS = 10_000;

type ReadinessState = 'checking' | 'waking' | 'unavailable' | 'ready';

interface ServerWakeGateProps {
    readonly children: ReactNode;
}

function healthUrl(): string {
    const baseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;
    if (!baseUrl) throw new Error('VITE_API_BASE_URL is not configured');
    return `${baseUrl.replace(/\/$/, '')}/health`;
}

export function ServerWakeGate({ children }: ServerWakeGateProps) {
    const [state, setState] = useState<ReadinessState>('checking');
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        const controller = new AbortController();
        let disposed = false;
        const slowResponseTimer = window.setTimeout(
            () => setState((current) => (current === 'checking' ? 'waking' : current)),
            SLOW_RESPONSE_DELAY_MS,
        );
        const requestTimeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
        let retryTimer: number | undefined;

        const checkReadiness = async () => {
            try {
                const response = await fetch(healthUrl(), {
                    cache: 'no-store',
                    signal: controller.signal,
                });
                if (!response.ok) throw new Error(`Health check returned ${response.status}`);
                setState('ready');
            } catch {
                if (disposed) return;
                setState('unavailable');
                retryTimer = window.setTimeout(() => {
                    setState('waking');
                    setAttempt((current) => current + 1);
                }, AUTO_RETRY_DELAY_MS);
            } finally {
                window.clearTimeout(slowResponseTimer);
                window.clearTimeout(requestTimeout);
            }
        };

        void checkReadiness();

        return () => {
            disposed = true;
            controller.abort();
            window.clearTimeout(slowResponseTimer);
            window.clearTimeout(requestTimeout);
            if (retryTimer !== undefined) window.clearTimeout(retryTimer);
        };
    }, [attempt]);

    if (state === 'ready') return children;

    const isUnavailable = state === 'unavailable';

    return (
        <main className="bg-surface text-surface-foreground relative flex min-h-svh items-center justify-center overflow-hidden px-6">
            <div className="bg-brand-100/60 dark:bg-brand-950/30 absolute -top-32 -right-24 size-96 rounded-full blur-3xl" />
            <div className="bg-brand-50 dark:bg-brand-900/20 absolute -bottom-40 -left-28 size-[28rem] rounded-full blur-3xl" />

            <section
                className="relative flex w-full max-w-md flex-col items-center text-center"
                role="status"
                aria-live="polite"
            >
                <div className="relative mb-7">
                    {!isUnavailable && (
                        <>
                            <span className="border-brand-300/60 absolute inset-0 animate-ping rounded-full border" />
                            <span className="border-brand-200 dark:border-brand-800 absolute -inset-3 rounded-full border" />
                        </>
                    )}
                    <span className="border-border bg-surface shadow-brand-900/10 relative flex size-20 items-center justify-center rounded-full border shadow-lg">
                        {isUnavailable ? (
                            <Server className="text-brand-600 size-9" />
                        ) : (
                            <img src={logo} alt="" className="size-12" />
                        )}
                    </span>
                </div>

                <p className="text-brand-600 mb-2 text-xs font-semibold tracking-[0.2em] uppercase">
                    Expense Splitter
                </p>
                <h1 className="font-display text-3xl font-semibold">
                    {isUnavailable ? 'The server is taking a break' : 'Getting things ready'}
                </h1>
                <p className="text-muted-foreground mt-3 max-w-sm text-sm leading-relaxed">
                    {isUnavailable
                        ? "We haven't been able to reach it yet. We'll keep trying automatically."
                        : state === 'waking'
                          ? 'Our free server is waking up. This can take about a minute, and the app will open automatically.'
                          : 'Checking that the server is ready…'}
                </p>

                {isUnavailable ? (
                    <button
                        type="button"
                        onClick={() => {
                            setState('waking');
                            setAttempt((current) => current + 1);
                        }}
                        className="bg-brand-600 hover:bg-brand-700 mt-7 inline-flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white"
                    >
                        <RefreshCw className="size-4" /> Try again now
                    </button>
                ) : (
                    <div className="mt-8 flex items-center gap-2" aria-hidden="true">
                        {[0, 150, 300].map((delay) => (
                            <span
                                key={delay}
                                className="bg-brand-500 size-2 animate-bounce rounded-full"
                                style={{ animationDelay: `${delay}ms` }}
                            />
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}
