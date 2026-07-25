import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { simulateLatency } from './latency';

describe('simulateLatency', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('resolves with the operation result after a delay', async () => {
        const operation = vi.fn().mockResolvedValue('result');

        const promise = simulateLatency(operation);
        expect(operation).not.toHaveBeenCalled();

        await vi.advanceTimersByTimeAsync(400);

        await expect(promise).resolves.toBe('result');
    });

    it('rejects when the operation rejects', async () => {
        const operation = vi.fn().mockImplementation(() => Promise.reject(new Error('boom')));

        const promise = simulateLatency(operation);
        const assertion = expect(promise).rejects.toThrow('boom');

        await vi.advanceTimersByTimeAsync(400);

        await assertion;
    });

    it('falls back to the minimum delay when getRandomValues returns no entries', async () => {
        const getRandomValuesSpy = vi
            .spyOn(crypto, 'getRandomValues')
            .mockReturnValue(new Uint32Array(0) as unknown as Uint32Array<ArrayBuffer>);
        const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');

        const operation = vi.fn().mockResolvedValue('result');
        const promise = simulateLatency(operation);

        expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 150);

        await vi.advanceTimersByTimeAsync(150);
        await expect(promise).resolves.toBe('result');

        getRandomValuesSpy.mockRestore();
    });
});
