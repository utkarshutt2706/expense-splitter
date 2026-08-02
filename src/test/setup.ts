import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';
import { afterEach } from 'vitest';

afterEach(() => {
    cleanup();
});

// jsdom doesn't implement matchMedia at all — useIsDarkTheme (system-preference
// resolution) needs a working stub so it doesn't throw in every test that renders
// anything using it. Defaults to "no preference matched"; tests that care about a
// specific system preference override this with their own mock.
if (!window.matchMedia) {
    window.matchMedia = (query: string) =>
        ({
            matches: false,
            media: query,
            onchange: null,
            addListener: () => {},
            removeListener: () => {},
            addEventListener: () => {},
            removeEventListener: () => {},
            dispatchEvent: () => false,
        }) as MediaQueryList;
}
