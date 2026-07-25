/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig(({ command }) => ({
    // GitHub Pages serves the production build as a project site
    // (username.github.io/expense-splitter/), not at the domain root, so only the
    // actual build needs this prefix — applying it to dev/test would break both.
    base: command === 'build' ? '/expense-splitter/' : '/',
    plugins: [react(), tailwindcss()],
    test: {
        environment: 'jsdom',
        setupFiles: ['./src/test/setup.ts'],
        globals: false,
        coverage: {
            provider: 'v8',
            // json-summary and json are required by the PR coverage-report action,
            // not just for local reading.
            reporter: ['text', 'lcov', 'html', 'json-summary', 'json'],
            reportOnFailure: true,
            include: ['src/**/*.{ts,tsx}'],
            exclude: ['src/main.tsx', 'src/test/**', 'src/**/*.test.{ts,tsx}'],
            thresholds: {
                lines: 80,
                functions: 80,
                branches: 80,
                statements: 80,
            },
        },
    },
}));
