import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useServerReadiness } from './useServerReadiness';

const response = (ok: boolean, status = ok ? 200 : 503) => ({ ok, status }) as Response;

async function flushPromises() {
    await act(async () => {
        await Promise.resolve();
    });
}

describe('useServerReadiness', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.test/');
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllGlobals();
        vi.unstubAllEnvs();
    });

    it('checks the normalized health URL and becomes ready after a successful response', async () => {
        const fetchMock = vi.fn().mockResolvedValue(response(true));
        vi.stubGlobal('fetch', fetchMock);

        const { result } = renderHook(() => useServerReadiness());
        expect(result.current.state).toBe('checking');
        await flushPromises();

        expect(result.current.state).toBe('ready');
        expect(fetchMock).toHaveBeenCalledOnce();
        expect(fetchMock).toHaveBeenCalledWith('https://api.example.test/health', {
            cache: 'no-store',
            signal: expect.any(AbortSignal),
        });
    });

    it('reports that a pending server is waking after the slow-response delay', () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(() => new Promise(() => undefined)),
        );
        const { result } = renderHook(() => useServerReadiness());

        act(() => vi.advanceTimersByTime(1_499));
        expect(result.current.state).toBe('checking');
        act(() => vi.advanceTimersByTime(1));
        expect(result.current.state).toBe('waking');
    });

    it('becomes unavailable for an unsuccessful response', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(false, 503)));
        const { result } = renderHook(() => useServerReadiness());

        await flushPromises();

        expect(result.current.state).toBe('unavailable');
    });

    it('automatically retries an unavailable server after ten seconds', async () => {
        const fetchMock = vi
            .fn()
            .mockResolvedValueOnce(response(false))
            .mockResolvedValueOnce(response(true));
        vi.stubGlobal('fetch', fetchMock);
        const { result } = renderHook(() => useServerReadiness());
        await flushPromises();

        act(() => vi.advanceTimersByTime(9_999));
        expect(fetchMock).toHaveBeenCalledOnce();
        await act(() => vi.advanceTimersByTimeAsync(1));
        await flushPromises();

        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(result.current.state).toBe('ready');
    });

    it('retries immediately when requested', async () => {
        const fetchMock = vi
            .fn()
            .mockResolvedValueOnce(response(false))
            .mockResolvedValueOnce(response(true));
        vi.stubGlobal('fetch', fetchMock);
        const { result } = renderHook(() => useServerReadiness());
        await flushPromises();

        act(() => result.current.retry());
        expect(result.current.state).toBe('waking');
        await flushPromises();

        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(result.current.state).toBe('ready');
    });

    it('aborts the request after the request timeout', () => {
        const fetchMock = vi.fn((_url: string, init?: RequestInit) => {
            expect(init?.signal?.aborted).toBe(false);
            return new Promise(() => undefined);
        });
        vi.stubGlobal('fetch', fetchMock);
        renderHook(() => useServerReadiness());
        const signal = fetchMock.mock.calls[0]?.[1]?.signal;

        act(() => vi.advanceTimersByTime(90_000));

        expect(signal?.aborted).toBe(true);
    });

    it('aborts pending work and prevents state updates after unmount', async () => {
        let resolveFetch!: (value: Response) => void;
        const fetchMock = vi.fn(() => new Promise<Response>((resolve) => (resolveFetch = resolve)));
        vi.stubGlobal('fetch', fetchMock);
        const { result, unmount } = renderHook(() => useServerReadiness());
        const signal = fetchMock.mock.calls[0]?.[1]?.signal;

        unmount();
        resolveFetch(response(false));
        await flushPromises();

        expect(signal?.aborted).toBe(true);
        expect(result.current.state).toBe('checking');
        expect(vi.getTimerCount()).toBe(0);
    });
});
