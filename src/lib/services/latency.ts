const MIN_LATENCY_MS = 150;
const MAX_LATENCY_MS = 400;

export function simulateLatency<T>(operation: () => Promise<T>): Promise<T> {
    const delay = MIN_LATENCY_MS + Math.random() * (MAX_LATENCY_MS - MIN_LATENCY_MS);
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            operation().then(resolve, reject);
        }, delay);
    });
}
