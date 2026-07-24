# Expense Splitter

A frontend-only expense splitting application inspired by Splitwise, built with React
and TypeScript. There is no backend yet — data lives locally in the browser (IndexedDB),
behind a storage abstraction designed so a real API can be swapped in later without
touching feature code.

## Tech stack

- React + TypeScript
- Vite
- TailwindCSS
- React Router
- React Query
- Zustand
- React Hook Form + Zod
- Dexie (IndexedDB)
- Vitest + React Testing Library

## Getting started

Requires Node 24+ and [pnpm](https://pnpm.io).

```bash
pnpm install
pnpm dev
```

## Scripts

| Command             | Description                              |
| ------------------- | ---------------------------------------- |
| `pnpm dev`          | Start the dev server                     |
| `pnpm build`        | Type-check and build for production      |
| `pnpm preview`      | Preview the production build locally     |
| `pnpm format`       | Format the codebase with Prettier        |
| `pnpm format:check` | Check formatting without writing changes |

## License

MIT
