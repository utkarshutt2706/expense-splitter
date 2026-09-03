import { useEffect, useState } from 'react';

const SLOW_RESPONSE_DELAY_MS = 1_500;
const REQUEST_TIMEOUT_MS = 90_000;
const AUTO_RETRY_DELAY_MS = 10_000;
export type ReadinessState = 'checking' | 'waking' | 'unavailable' | 'ready';

function healthUrl(): string {
    const baseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;
    if (!baseUrl) throw new Error('VITE_API_BASE_URL is not configured');
    return `${baseUrl.replace(/\/$/, '')}/health`;
}

export function useServerReadiness() {
    const [state, setState] = useState<ReadinessState>('checking');
    const [attempt, setAttempt] = useState(0);
    useEffect(() => {
        const controller = new AbortController();
        let disposed = false;
        const slowTimer = window.setTimeout(
            () => setState((current) => (current === 'checking' ? 'waking' : current)),
            SLOW_RESPONSE_DELAY_MS,
        );
        const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
        let retryTimer: number | undefined;
        void fetch(healthUrl(), { cache: 'no-store', signal: controller.signal })
            .then((response) => {
                if (!response.ok) throw new Error(`Health check returned ${response.status}`);
                setState('ready');
            })
            .catch(() => {
                if (disposed) return;
                setState('unavailable');
                retryTimer = window.setTimeout(() => {
                    setState('waking');
                    setAttempt((current) => current + 1);
                }, AUTO_RETRY_DELAY_MS);
            })
            .finally(() => {
                window.clearTimeout(slowTimer);
                window.clearTimeout(timeout);
            });
        return () => {
            disposed = true;
            controller.abort();
            window.clearTimeout(slowTimer);
            window.clearTimeout(timeout);
            if (retryTimer !== undefined) window.clearTimeout(retryTimer);
        };
    }, [attempt]);
    return {
        state,
        retry: () => {
            setState('waking');
            setAttempt((value) => value + 1);
        },
    };
}
