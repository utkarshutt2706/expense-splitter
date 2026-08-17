import '@fontsource-variable/fraunces';
import '@fontsource-variable/ibm-plex-sans';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';

import { ServerWakeGate } from '@app/components';
import { AppProviders } from '@app/providers';
import { router } from '@app/router.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <AppProviders>
            <ServerWakeGate>
                <RouterProvider router={router} />
            </ServerWakeGate>
        </AppProviders>
    </StrictMode>,
);
