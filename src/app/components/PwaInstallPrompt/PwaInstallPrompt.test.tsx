import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PwaInstallPrompt } from './PwaInstallPrompt';

function useUserAgent(userAgent: string) {
    vi.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue(userAgent);
}

function useDisplayMode(standalone: boolean) {
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: standalone } as MediaQueryList);
}

describe('PwaInstallPrompt', () => {
    beforeEach(() => {
        sessionStorage.clear();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('shows iPhone users how to add the app to their home screen', async () => {
        useUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)');
        useDisplayMode(false);

        render(<PwaInstallPrompt />);

        expect(await screen.findByText(/tap share, then/i)).toBeInTheDocument();
        expect(screen.getByText(/add to home screen/i)).toBeInTheDocument();
    });

    it('opens the native Android install prompt when the browser provides one', async () => {
        useUserAgent('Mozilla/5.0 (Linux; Android 15; Pixel 9)');
        useDisplayMode(false);
        const prompt = vi.fn().mockResolvedValue(undefined);
        const installEvent = new Event('beforeinstallprompt', { cancelable: true });
        Object.assign(installEvent, {
            prompt,
            userChoice: Promise.resolve({ outcome: 'accepted', platform: 'web' }),
        });
        const user = userEvent.setup();

        render(<PwaInstallPrompt />);
        fireEvent(window, installEvent);
        await user.click(await screen.findByRole('button', { name: /install app/i }));

        expect(prompt).toHaveBeenCalledOnce();
        await waitFor(() =>
            expect(screen.queryByRole('button', { name: /install app/i })).not.toBeInTheDocument(),
        );
    });

    it('provides Android menu instructions while the native prompt is unavailable', async () => {
        useUserAgent('Mozilla/5.0 (Linux; Android 15; Pixel 9)');
        useDisplayMode(false);

        render(<PwaInstallPrompt />);

        expect(await screen.findByText(/open your browser menu/i)).toBeInTheDocument();
    });

    it('does not suggest installation when already running as an installed app', () => {
        useUserAgent('Mozilla/5.0 (Linux; Android 15; Pixel 9)');
        useDisplayMode(true);

        render(<PwaInstallPrompt />);

        expect(screen.queryByLabelText(/install expense splitter/i)).not.toBeInTheDocument();
    });

    it('lets the user dismiss the suggestion', async () => {
        useUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)');
        useDisplayMode(false);
        const user = userEvent.setup();

        render(<PwaInstallPrompt />);
        await user.click(
            await screen.findByRole('button', { name: /dismiss install suggestion/i }),
        );

        expect(screen.queryByLabelText(/install expense splitter/i)).not.toBeInTheDocument();
        expect(sessionStorage.getItem('pwa-install-suggestion-dismissed')).toBe('true');
    });

    it('automatically dismisses the suggestion after its countdown', async () => {
        vi.useFakeTimers();
        useUserAgent('Mozilla/5.0 (Linux; Android 15; Pixel 9)');
        useDisplayMode(false);
        const installEvent = new Event('beforeinstallprompt', { cancelable: true });
        Object.assign(installEvent, {
            prompt: vi.fn().mockResolvedValue(undefined),
            userChoice: Promise.resolve({ outcome: 'dismissed', platform: 'web' }),
        });

        render(<PwaInstallPrompt />);
        fireEvent(window, installEvent);
        expect(screen.getByLabelText(/install expense splitter/i)).toBeInTheDocument();

        await act(() => vi.advanceTimersByTimeAsync(10_000));

        expect(screen.queryByLabelText(/install expense splitter/i)).not.toBeInTheDocument();
        expect(sessionStorage.getItem('pwa-install-suggestion-dismissed')).toBe('true');
    });
});
