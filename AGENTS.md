# AGENTS.md

## Repo shape

- Two independent npm packages, **no root package.json / no workspaces**: `backend/` and `frontend/`. Run every npm command from inside those directories.
- **Backend** — Express 5 + TypeScript ESM (`"type": "module"`), Drizzle ORM + Postgres. Entry: `src/index.ts` (listens on `:3000`) → `src/server.ts`, which mounts all routes (`/api/*`, `/auth/*`), the global IP rate limiter, and the central error handler. Layers: `routes/ → middlewares/ → services/ → repository/ → db/`.
- **Frontend** — React 19 + Vite 7, **plain JS/JSX: no TypeScript and no typecheck** (the README's "TypeScript" claim is wrong). Entry: `src/main.jsx` → `src/App.jsx` (whole route table + inline `ProtectedRoute`/`StudentRoute` guards reading `AuthContext`). Tailwind 3.
- `README.md` is truncated mid-"Getting Started" — it contains no run/test instructions. Trust package.json/scripts over docs.

## Commands

Backend (`backend/`):

- `npm run dev` — dev server on `:3000` (`tsx watch`). This is the only way to run it: `npm run build` is `tsc` with `noEmit: true` (`outDir` commented out), so it emits nothing and `npm start` (`node dist/index.js`) can never work.
- `npx tsc --noEmit` — typecheck. There is **no backend lint/format script** and no backend ESLint config.
- `npm test` (= `npm run test:unit`) — unit suite, no DB needed.
- `npm run test:int` — integration suite (prereqs below).
- Filter tests: `npm test -- --testPathPatterns <regex>`. Jest 30 renamed the flag — the singular `--testPathPattern` fails with "Option was replaced".

Frontend (`frontend/`):

- `npm run dev` (Vite, `:5173`), `npm run lint`, `npm run build`, `npm run preview`. **No tests exist for the frontend.**

## Environment / services

- Backend reads `backend/.env` (gitignored; copy `backend/.env.example`). `DATABASE_URL`, `JWT_SECRET`, `REFRESH_TOKEN_SECRET` are hard-required at import time (`src/db/db.ts`). Also used: `GROQ_API_KEY` (AI grading), `CORS_ORIGIN` (defaults to `http://localhost:5173`), `REDIS_HOST/PORT/PASSWORD/DB`.
- **Redis must be running for any backend request to succeed**: the global IP rate limiter (`src/middlewares/ipBasedRateLimiter.middleware.ts`) runs on every route and returns 500 if Redis is unreachable — this also applies to supertest calls in integration tests. Default `localhost:6379`.
- Frontend needs `frontend/.env` with `VITE_BACKEND_HOST` (e.g. `http://localhost:3000`); every service/page builds API URLs from it.
- DB schema: `npm run db:migrate` = `drizzle-kit push` (push is the source of truth; `src/db/migration/` is gitignored, so **no committed migration files**). `npm run db:generate` writes generated SQL.
- Fresh clone: `backend/.env`, `backend/.env.test`, and `frontend/.env` are all gitignored — create them yourself.

## Testing quirks

- Configs: `jest.config.js` → re-exports `jest.config.unit.js` (default run = unit). `jest.config.integration.js` adds `globalSetup`/`globalTeardown`/`loadEnv`. Base is ESM + ts-jest, so jest must run via `node --experimental-vm-modules ...` — the npm scripts already do this; don't hand-roll jest commands.
- Layout: unit tests `src/tests/unit/*.unit.test.ts`, integration `src/tests/integration/*.int.test.ts`.
- Integration prerequisites: a pgvector Postgres reachable via **`backend/.env.test` → `DATABASE_URL` (ships empty — fill it)**, plus running Redis. `globalSetup.ts` itself runs `npx drizzle-kit push`, creates the `vector` extension, truncates every table, and seeds:
  - `teacher@test.com` / `TeacherPass1!`
  - `student@test.com` / `StudentPass1!`
  - `student2@test.com` / `Student2Pass2!`
  - Shared helpers (`loginAs`, `authHeader`, `*_CREDS`) live in `src/tests/integration/setup/testHelpers.ts`.

## Baseline at HEAD (verified 2026-09-27)

No known fails — frontend `npm run build` and `npm run lint`, backend `npx tsc --noEmit` and `npm test` (unit suite) all pass at HEAD. Re-verify your own baseline instead of assuming you broke it: if any of these fail before you change something, that's new information — update this section.

## CI

- Only workflow: `.github/workflows/integration-tests.yml` (on PRs). It installs deps, enables pgvector, and runs `drizzle-kit push` — but the **test step is `if: false`, so no tests actually run in CI**. Don't assume CI validates your change.
- `CODEOWNERS`: everything → `@SodaBeats`.

## Conventions & stale docs

- Colors: use tokens from `src/theme/colors.js` (Tailwind classes like `bg-surface-900`, `text-brand-500`, or `:root` CSS vars / `colors.*` for inline styles) instead of raw hex — a recent refactor centralized the palette.
- `docs/past-changes/frontend-refactor-notes.md` is a copy of the pre-refactor AGENTS.md: its flat `pages/`/`components/` layout, `reference.jsx`, and "no subfolders" notes are outdated (both `pages/` and `components/` now have `teacher/` + `student/` subfolders; `reference.jsx` was deleted).
- Prettier config sits at the repo root (`.prettierrc`: semi, tabWidth 2); no format script exists.

## Known Gotchas (read before touching these areas)

- TanStack Query: `cacheTime` is dead — it's `gcTime` now. `staleTime: Infinity` + `refetchOnMount: false` can permanently cache a bad transient state.
- Drizzle: `pgTable`'s third argument must be an array, not an object (old object-callback form is deprecated). `primaryKey()` requires a `name` property.
- SQL: plain INNER JOINs silently drop zero-attempt records — use LEFT JOIN where absence is meaningful.
- Backend: `db.ts` needs a `pool.on('error')` listener or Neon's serverless pool idle-timeout crashes the process.
- Git: prefer `git switch` / `git restore` over `git checkout`. `gh pr checkout <PR-number>` works from any branch.
