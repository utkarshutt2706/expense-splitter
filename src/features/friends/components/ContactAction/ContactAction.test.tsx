import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { toast } from 'sonner';
import { ContactAction } from './ContactAction';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function device(userAgent: string, writeText = vi.fn().mockResolvedValue(undefined)) {
    vi.stubGlobal('navigator', { ...window.navigator, userAgent, clipboard: { writeText } });
    return writeText;
}

describe('ContactAction', () => {
    afterEach(() => vi.unstubAllGlobals());

    it.each([
        ['email', 'alex@example.com', 'Email Alex at alex@example.com; copy email'],
        ['phone', '+911234567890', 'Call Alex at +911234567890; copy phone'],
    ] as const)('copies a desktop %s contact and confirms success', async (kind, value, label) => {
        const writeText = device('Desktop Browser');
        render(<ContactAction friendName="Alex" kind={kind} value={value} />);
        fireEvent.click(screen.getByRole('button', { name: label }));
        await waitFor(() => expect(writeText).toHaveBeenCalledWith(value));
        expect(toast.success).toHaveBeenCalled();
    });

    it('reports clipboard failures', async () => {
        device('Desktop Browser', vi.fn().mockRejectedValue(new Error('Denied')));
        render(<ContactAction friendName="Alex" kind="email" value="alex@example.com" />);
        fireEvent.click(screen.getByRole('button'));
        await waitFor(() =>
            expect(toast.error).toHaveBeenCalledWith('Could not copy the email address.'),
        );
    });

    it('offers native and copy actions on mobile devices', () => {
        device('Mozilla/5.0 (iPhone)');
        render(<ContactAction friendName="Alex" kind="phone" value="+911234567890" />);
        fireEvent.click(screen.getByRole('button', { name: /choose an action/i }));
        expect(screen.getByRole('button', { name: 'Copy phone' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Call phone' })).toHaveAttribute(
            'href',
            'tel:+911234567890',
        );
    });

    it.each([
        [true, /choose an action/i],
        [false, /copy email/i],
    ] as const)(
        'prefers userAgentData.mobile=%s over the legacy user agent',
        (mobile, expectedLabel) => {
            const writeText = vi.fn().mockResolvedValue(undefined);
            vi.stubGlobal('navigator', {
                ...window.navigator,
                userAgent: mobile ? 'Desktop Browser' : 'Mozilla/5.0 (iPhone)',
                userAgentData: { mobile },
                clipboard: { writeText },
            });

            render(<ContactAction friendName="Alex" kind="email" value="alex@example.com" />);

            expect(screen.getByRole('button', { name: expectedLabel })).toBeInTheDocument();
        },
    );

    it('offers the native email action and copies from the mobile menu', async () => {
        const writeText = device('Android Mobile');
        render(<ContactAction friendName="Alex" kind="email" value="alex@example.com" />);

        fireEvent.click(screen.getByRole('button', { name: /choose an action/i }));
        expect(screen.getByRole('link', { name: 'Send email' })).toHaveAttribute(
            'href',
            'mailto:alex@example.com',
        );
        fireEvent.click(screen.getByRole('button', { name: 'Copy email' }));
        await waitFor(() => expect(writeText).toHaveBeenCalledWith('alex@example.com'));
    });
});
