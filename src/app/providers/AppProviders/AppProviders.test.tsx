import { useQueryClient } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { queryClient } from '@app/providers/queryClient';
import { AppProviders } from './AppProviders';

const { toasterMock } = vi.hoisted(() => ({
    toasterMock: vi.fn(() => <div data-testid="toaster" />),
}));

vi.mock('sonner', () => ({ Toaster: toasterMock }));

function QueryClientConsumer() {
    const client = useQueryClient();
    return <p>{client === queryClient ? 'shared query client' : 'unexpected query client'}</p>;
}

describe('AppProviders', () => {
    beforeEach(() => {
        toasterMock.mockClear();
    });

    it('renders its children', () => {
        render(
            <AppProviders>
                <p>child content</p>
            </AppProviders>,
        );

        expect(screen.getByText('child content')).toBeInTheDocument();
    });

    it('provides the shared application query client to descendants', () => {
        render(
            <AppProviders>
                <QueryClientConsumer />
            </AppProviders>,
        );

        expect(screen.getByText('shared query client')).toBeInTheDocument();
    });

    it('mounts the global toaster with the intended placement and status styles', () => {
        render(<AppProviders>content</AppProviders>);

        expect(screen.getByTestId('toaster')).toBeInTheDocument();
        expect(toasterMock).toHaveBeenCalledWith(
            {
                position: 'top-right',
                closeButton: true,
                toastOptions: {
                    classNames: {
                        loading: 'bg-toast-progress-bg! text-toast-progress-text!',
                        success: 'bg-toast-success-bg! text-toast-success-text!',
                        error: 'bg-toast-error-bg! text-toast-error-text!',
                        warning: 'bg-toast-warning-bg! text-toast-warning-text!',
                    },
                },
            },
            undefined,
        );
    });
});
