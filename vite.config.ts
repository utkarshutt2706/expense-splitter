/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const resolvePath = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig(({ command }) => ({
    // GitHub Pages serves the production build as a project site
    // (username.github.io/expense-splitter/), not at the domain root, so only the
    // actual build needs this prefix — applying it to dev/test would break both.
    base: command === 'build' ? '/expense-splitter/' : '/',
    plugins: [
        react(),
        tailwindcss(),
        VitePWA({
            registerType: 'autoUpdate',
            // The real manifest (name, icons, theme/background color, display mode)
            // already exists as public/site.webmanifest, linked from index.html since
            // the Phase 2/3 icon work — this just adds the service worker on top of
            // it rather than having the plugin generate a second, competing manifest.
            manifest: false,
            includeAssets: [
                'favicon.ico',
                'favicon-96x96.png',
                'apple-touch-icon.png',
                'web-app-manifest-192x192.png',
                'web-app-manifest-512x512.png',
            ],
            workbox: {
                // No backend yet — every read/write already goes straight to local
                // IndexedDB, so there's no API traffic to runtime-cache. Precaching
                // the built app shell is what makes a hard refresh work offline.
                globPatterns: ['**/*.{js,css,html,woff2}'],
            },
        }),
    ],
    resolve: {
        alias: {
            '@app': resolvePath('./src/app'),
            '@assets': resolvePath('./src/assets'),
            '@features': resolvePath('./src/features'),
            '@lib': resolvePath('./src/lib'),
            '@shared': resolvePath('./src/shared'),
            '@test': resolvePath('./src/test'),
        },
    },
    test: {
        environment: 'jsdom',
        setupFiles: ['./src/test/animationEventPolyfill.ts', './src/test/setup.ts'],
        globals: false,
        coverage: {
            provider: 'v8',
            // json-summary is required for the PR summary; json supplies its
            // changed-file detail. LCOV is consumed by SonarCloud.
            reporter: ['text', 'lcov', 'json-summary', 'json'],
            reportOnFailure: true,
            include: ['src/**/*.{ts,tsx}'],
            exclude: [
                'src/main.tsx',
                'src/test/**',
                'src/**/index.ts',
                'src/vite-env.d.ts',
                'src/lib/api/generated/**',
            ],
            thresholds: {
                lines: 80,
                functions: 80,
                branches: 80,
                statements: 80,
            },
        },
    },
}));
