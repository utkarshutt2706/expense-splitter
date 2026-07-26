import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { Toaster } from 'sonner';
import { queryClient } from './queryClient';

interface AppProvidersProps {
    children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
    return (
        <QueryClientProvider client={queryClient}>
            {children}
            <Toaster
                position="top-right"
                closeButton
                toastOptions={{
                    classNames: {
                        loading: 'bg-toast-progress-bg! text-toast-progress-text!',
                        success: 'bg-toast-success-bg! text-toast-success-text!',
                        error: 'bg-toast-error-bg! text-toast-error-text!',
                        warning: 'bg-toast-warning-bg! text-toast-warning-text!',
                    },
                }}
            />
        </QueryClientProvider>
    );
}
