const MIN_LATENCY_MS = 150;
const MAX_LATENCY_MS = 400;

function randomUnitInterval(): number {
    const [value] = crypto.getRandomValues(new Uint32Array(1));
    return (value ?? 0) / (0xffffffff + 1);
}

export function simulateLatency<T>(operation: () => Promise<T>): Promise<T> {
    const delay = MIN_LATENCY_MS + randomUnitInterval() * (MAX_LATENCY_MS - MIN_LATENCY_MS);
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            operation().then(resolve, reject);
        }, delay);
    });
}
