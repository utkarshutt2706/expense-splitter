# Expense Splitter

A frontend expense splitting application inspired by Splitwise, built with React and
TypeScript and backed by the companion Expense Splitter API.

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

| Command              | Description                              |
| -------------------- | ---------------------------------------- |
| `pnpm dev`           | Start the dev server                     |
| `pnpm build`         | Type-check and build for production      |
| `pnpm generate:api`  | Generate API types from the backend spec |
| `pnpm preview`       | Preview the production build locally     |
| `pnpm format`        | Format the codebase with Prettier        |
| `pnpm format:check`  | Check formatting without writing changes |
| `pnpm lint`          | Lint the codebase with ESLint            |
| `pnpm lint:fix`      | Lint and auto-fix what's fixable         |
| `pnpm test`          | Run the test suite once                  |
| `pnpm test:watch`    | Run the test suite in watch mode         |
| `pnpm test:coverage` | Run tests with coverage (80% threshold)  |

## API contract

The backend is the source of truth for the HTTP contract. Its committed `openapi.json`
is generated from the Nest controllers and DTOs, and `pnpm generate:api` converts that
document into `src/lib/api/generated/schema.ts`. Both generated files are committed so
each repository can build independently.

After changing an endpoint or DTO, run `pnpm generate:openapi` in the sibling
`expense-splitter-api` repository, then run `pnpm generate:api` here. Do not edit the
generated schema by hand. Frontend-only compatibility and view-model types belong in
`src/data`; request and response transport types belong in `src/lib/api/contracts.ts`.

## Restoring the removed invitation flow

The invite-aware registration flow was removed after email invitations were dropped
from the backend because the deployed free-tier setup could not provide reliable email
delivery. The complete frontend implementation remains in Git history at commit
`aa6a35e7dcd9495eb048522fe5bde68011c7f5a1`, dated 2026-08-30.

Inspect individual files with
`git show aa6a35e7dcd9495eb048522fe5bde68011c7f5a1:path/to/file`, or restore the
snapshot on a new branch with
`git switch -c restore/invitations aa6a35e7dcd9495eb048522fe5bde68011c7f5a1` and
reapply later changes as needed.

## License

MIT
