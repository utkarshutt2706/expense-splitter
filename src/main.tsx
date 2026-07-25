import '@fontsource-variable/fraunces';
import '@fontsource-variable/ibm-plex-sans';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { AppProviders } from './app/providers.tsx';
import { router } from './app/router.tsx';
import { expenseRepository, groupRepository, userRepository } from './lib/storage/db.ts';
import { seedDatabase } from './lib/storage/seed.ts';
import './index.css';

async function main() {
    await seedDatabase({
        users: userRepository,
        groups: groupRepository,
        expenses: expenseRepository,
    });

    createRoot(document.getElementById('root')!).render(
        <StrictMode>
            <AppProviders>
                <RouterProvider router={router} />
            </AppProviders>
        </StrictMode>,
    );
}

main();
