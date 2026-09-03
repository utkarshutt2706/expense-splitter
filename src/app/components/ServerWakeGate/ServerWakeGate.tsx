import { RefreshCw } from 'lucide-react';
import type { ReactNode } from 'react';

import logo from '@assets/logo.svg';
import { useServerReadiness } from '@app/hooks/useServerReadiness';
import { InjuredServerIllustration } from './InjuredServerIllustration';

import styles from './ServerWakeGate.module.css';

type ServerWakeGateProps = Readonly<{
    children: ReactNode;
}>;

export function ServerWakeGate({ children }: ServerWakeGateProps) {
    const { state, retry } = useServerReadiness();

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
                            retry();
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
