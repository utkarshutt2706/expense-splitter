import '@fontsource-variable/ibm-plex-sans';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';

import { PwaInstallPrompt, ServerWakeGate, SessionBootstrap } from '@app/components';
import { AppProviders } from '@app/providers';
import { router } from '@app/router.tsx';
import { registerStaleChunkRecovery } from '@app/staleChunkRecovery';
import './index.css';

registerStaleChunkRecovery();

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <AppProviders>
            <ServerWakeGate>
                <SessionBootstrap>
                    <RouterProvider router={router} />
                </SessionBootstrap>
            </ServerWakeGate>
            <PwaInstallPrompt />
        </AppProviders>
    </StrictMode>,
);
