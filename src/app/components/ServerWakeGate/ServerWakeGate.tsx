import { RefreshCw } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';

import logo from '@assets/logo.svg';

import styles from './ServerWakeGate.module.css';

const SLOW_RESPONSE_DELAY_MS = 1_500;
const REQUEST_TIMEOUT_MS = 90_000;
const AUTO_RETRY_DELAY_MS = 10_000;

type ReadinessState = 'checking' | 'waking' | 'unavailable' | 'ready';

type ServerWakeGateProps = Readonly<{
    children: ReactNode;
}>;

function InjuredServerIllustration() {
    return (
        <div
            className="relative flex size-24 -rotate-2 items-center justify-center"
            role="img"
            aria-label="An injured server waiting to recover"
        >
            <svg
                viewBox="0 0 112 96"
                className="drop-shadow-brand-900/15 size-full drop-shadow-md"
                aria-hidden="true"
            >
                <path
                    d="M20 18a10 10 0 0 1 10-10h52a10 10 0 0 1 10 10v58a10 10 0 0 1-10 10H30a10 10 0 0 1-10-10V18Z"
                    className="fill-surface stroke-brand-500"
                    strokeWidth="4"
                />
                <path d="M22 35h68M22 57h68" className={styles.rule} strokeWidth="3" />
                <circle cx="33" cy="22" r="4" className="fill-brand-500" />
                <circle cx="33" cy="46" r="4" className="fill-brand-400" />
                <circle cx="33" cy="69" r="4" className="fill-brand-300" />
                <g className={styles.sadEyes}>
                    <path
                        d="M49 49l5-3M67 46l5 3"
                        className="stroke-surface-foreground"
                        strokeLinecap="round"
                        strokeWidth="3"
                    />
                </g>
                <g className={styles.quiveringMouth}>
                    <path
                        d="M49 67c4-7 11-7 15 0"
                        className="stroke-surface-foreground"
                        strokeLinecap="round"
                        strokeWidth="3"
                    />
                </g>
                <g transform="rotate(-12 75 25)">
                    <rect
                        x="62"
                        y="18"
                        width="27"
                        height="13"
                        rx="6.5"
                        className="fill-amber-200 stroke-amber-500"
                        strokeWidth="2"
                    />
                    <path d="M72 20v9M78 20v9" className="stroke-amber-500" strokeWidth="1.5" />
                </g>
            </svg>
            <span
                className={`${styles.fallingTear} absolute top-[53%] left-[61%] h-4 w-2 rounded-[50%_50%_55%_55%] bg-sky-400/80`}
                aria-hidden="true"
            />
        </div>
    );
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
    let statusMessage = 'Checking that the server is ready…';
    if (isUnavailable) {
        statusMessage = "We haven't been able to reach it yet. We'll keep trying automatically.";
    } else if (state === 'waking') {
        statusMessage =
            'Our free server is waking up. This can take about a minute, and the app will open automatically.';
    }

    return (
        <main className="bg-surface text-surface-foreground relative flex min-h-svh items-center justify-center overflow-hidden px-6">
            <div
                className={`${styles.glowPrimary} absolute -top-32 -right-24 size-96 rounded-full blur-3xl`}
            />
            <div
                className={`${styles.glowSecondary} absolute -bottom-40 -left-28 size-[28rem] rounded-full blur-3xl`}
            />

            <section
                className="relative flex w-full max-w-md flex-col items-center text-center"
                role="status"
                aria-live="polite"
            >
                <div className="relative mb-7">
                    {!isUnavailable && (
                        <>
                            <span className="border-brand-300/60 absolute inset-0 animate-ping rounded-full border" />
                            <span
                                className={`${styles.hairline} absolute -inset-3 rounded-full border`}
                            />
                        </>
                    )}
                    <span
                        className={`border-border bg-surface shadow-brand-900/10 relative flex items-center justify-center rounded-full border shadow-lg ${
                            isUnavailable ? 'size-28' : 'size-20'
                        }`}
                    >
                        {isUnavailable ? (
                            <InjuredServerIllustration />
                        ) : (
                            <img src={logo} alt="" className="size-12" />
                        )}
                    </span>
                </div>

                <p className="text-brand-600 mb-2 text-xs font-semibold tracking-[0.2em] uppercase">
                    Expense Splitter
                </p>
                <h1 className="text-3xl font-semibold">
                    {isUnavailable ? 'The server is taking a break' : 'Getting things ready'}
                </h1>
                <p className="text-muted-foreground mt-3 max-w-sm text-sm leading-relaxed">
                    {statusMessage}
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
