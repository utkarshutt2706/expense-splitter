import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ServerWakeGate } from './ServerWakeGate';

const response = (ok: boolean, status = ok ? 200 : 503) => ({ ok, status }) as Response;

async function flushHealthCheck() {
    await act(async () => {
        await Promise.resolve();
    });
}

describe('ServerWakeGate', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllGlobals();
    });

    it('opens the app as soon as the server is ready', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(true)));

        render(
            <ServerWakeGate>
                <p>Application ready</p>
            </ServerWakeGate>,
        );

        expect(screen.getByText(/checking that the server is ready/i)).toBeInTheDocument();
        await flushHealthCheck();

        expect(screen.getByText('Application ready')).toBeInTheDocument();
        expect(fetch).toHaveBeenCalledWith(
            expect.stringMatching(/\/health$/),
            expect.objectContaining({ cache: 'no-store' }),
        );
    });

    it('explains a Render cold start when readiness takes longer than normal', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(() => new Promise(() => undefined)),
        );

        render(
            <ServerWakeGate>
                <p>Application ready</p>
            </ServerWakeGate>,
        );

        await act(() => vi.advanceTimersByTimeAsync(1_500));

        expect(screen.getByText(/free server is waking up/i)).toBeInTheDocument();
        expect(screen.queryByText('Application ready')).not.toBeInTheDocument();
    });

    it('retries a failed readiness check automatically and opens the app', async () => {
        const fetchMock = vi
            .fn()
            .mockResolvedValueOnce(response(false))
            .mockResolvedValueOnce(response(true));
        vi.stubGlobal('fetch', fetchMock);

        render(
            <ServerWakeGate>
                <p>Application ready</p>
            </ServerWakeGate>,
        );

        await flushHealthCheck();

        expect(screen.getByText(/server is taking a break/i)).toBeInTheDocument();
        expect(
            screen.getByRole('img', { name: /injured server waiting to recover/i }),
        ).toBeInTheDocument();

        await act(() => vi.advanceTimersByTimeAsync(10_000));
        await flushHealthCheck();

        expect(screen.getByText('Application ready')).toBeInTheDocument();
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('allows the user to retry immediately', async () => {
        const fetchMock = vi
            .fn()
            .mockResolvedValueOnce(response(false))
            .mockResolvedValueOnce(response(true));
        vi.stubGlobal('fetch', fetchMock);

        render(
            <ServerWakeGate>
                <p>Application ready</p>
            </ServerWakeGate>,
        );

        await flushHealthCheck();
        fireEvent.click(screen.getByRole('button', { name: /try again now/i }));
        await flushHealthCheck();

        expect(screen.getByText('Application ready')).toBeInTheDocument();
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });
});
