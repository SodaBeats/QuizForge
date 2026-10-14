# AGENTS.md

## Repo shape

- Two independent npm packages, **no root package.json / no workspaces**: `backend/` and `frontend/`. Run every npm command from inside those directories.
- **Backend** — Express 5 + TypeScript ESM (`"type": "module"`), Drizzle ORM + Postgres. Entry: `src/index.ts` (listens on `:3000`) → `src/server.ts`, which mounts all routes (`/api/*`, `/auth/*`) and the central error handler. Layers: `routes/ → middlewares/ → services/ → repository/ → db/`.
- **Frontend** — React 19 + Vite 7, **plain JS/JSX: no TypeScript and no typecheck script** (the `frontend/README.md` TypeScript notes are stock Vite-template boilerplate). Entry `src/main.jsx` → `src/App.jsx` (whole route table + inline `ProtectedRoute`/`StudentRoute` guards reading `AuthContext`). Tailwind 3.
- `README.md` is truncated mid-"Getting Started" — it contains no run/test instructions. Trust package.json/scripts over docs.
- **Active frontend refactor**: `docs/frontend-refactor-plan.md` (status: active, phases 0–5), derived from `docs/frontend-architecture.md`. Rules: `npm run lint` + `npm run build` green at the end of every phase; one phase per PR; never combine a folder move with a logic change; no behavior changes in Phases 1–3; non-goals: no TypeScript, no Redux/Zustand, no router rewrite. Don't kick off uncoordinated refactors — follow this plan or ask. Note: the merged `refactor/phase-1` PR (#26) was a _visual_ restyle, not plan-Phase 1 — the plan's checkboxes are all still unchecked.
- Stale docs (don't trust): `docs/past-changes/frontend-refactor-notes.md` is a copy of an older AGENTS.md (flat `pages/`/`components/` layout, `reference.jsx`). `backend/TEST_RUN_TROUBLESHOOTING.md` describes a Jest config problem that has since been fixed.

## Commands

Backend (`backend/`):

- `npm run dev` — dev server on `:3000` (`tsx watch`). This is the only way to run it: `npm run build` is `tsc` with `noEmit: true` (`outDir` commented out), so it emits nothing and `npm start` (`node dist/index.js`) can never work.
- `npx tsc --noEmit` — typecheck. There is **no backend lint/format script** and no backend ESLint config.
- `npm test` (= `npm run test:unit`) — unit suite, no DB needed.
- `npm run test:int` — integration suite (prereqs below).
- Filter tests: `npm test -- --testPathPatterns <regex>`. Jest 30 renamed the flag — the singular `--testPathPattern` fails with "Option was replaced".

Frontend (`frontend/`):

- `npm run dev` (Vite, default `:5173`), `npm run lint`, `npm run build`, `npm run preview`. **No tests exist for the frontend** — for any frontend change, `npm run lint` + `npm run build` is the verification.

Prettier config sits at the repo root (`.prettierrc`: semi, tabWidth 2); no format script exists.

## Environment / services

- Backend reads `backend/.env` (dotenv, at import). **Hard-required at import time** (`src/db/db.ts`): `DATABASE_URL`, `JWT_SECRET`, `REFRESH_TOKEN_SECRET`. Also used: `GROQ_API_KEY` (AI grading — checked lazily at call time, not at boot), `CORS_ORIGIN` (defaults to `http://localhost:5173`).
- **Redis is NOT required — rate limiting is currently disabled** ("temporarily disable rate limiting" commit): `src/middlewares/redis.ts` exports `redis = 'temporarily disabled'` (real client commented out), `server.ts` does not mount `ipRateLimiter`, and `userBasedRateLimiter` (used on most routes) calls `next()` immediately. `ioredis` is still in package.json. To re-enable, follow the comment in `redis.ts` and adjust both limiter middlewares.
- Migrations: **no committed migration files** — `/backend/src/db/migration/` is gitignored. `npm run db:migrate` = `drizzle-kit push` (schema push is the source of truth; `npm run db:generate` writes SQL files locally).
- Fresh clone: `backend/.env`, `backend/.env.test`, and `frontend/.env` are all gitignored — copy the tracked `.env.example` files. `frontend/.env` needs `VITE_BACKEND_HOST=http://localhost:3000`; it is read ad-hoc in ~14 files (plan Phase 1 will centralize it).

## Testing quirks

- Configs: `jest.config.js` → re-exports `jest.config.unit.js` (default run = unit). `jest.config.integration.js` adds `globalSetup`/`globalTeardown`/`loadEnv`. Base is ESM + ts-jest, so jest must run via `node --experimental-vm-modules ...` — the npm scripts already do this; don't hand-roll jest commands.
- Layout: unit tests `src/tests/unit/*.unit.test.ts`, integration `src/tests/integration/*.int.test.ts`.
- Unit suite is pure (3 suites / 10 tests) — needs no DB, Redis, or API keys.
- Integration prerequisites: a pgvector Postgres reachable via **`backend/.env.test` → `DATABASE_URL` (ships empty — fill it)**. No Redis needed. `globalSetup.ts` itself runs `npx drizzle-kit push`, truncates every table, and seeds:
  - `teacher@test.com` / `TeacherPass1!`
  - `student@test.com` / `StudentPass1!`
  - `student2@test.com` / `Student2Pass2!`
- **Gotcha**: create the `vector` extension on the test DB _before_ running `test:int` — `globalSetup` pushes the schema before it creates the extension (CI does extension → push for the same reason).
- Shared helpers (`loginAs`, `authHeader`, `*_CREDS`, `generateShareToken`) live in `src/tests/integration/setup/testHelpers.ts`.

## CI

- Only workflow: `.github/workflows/integration-tests.yml` (on PRs). It installs backend deps, enables pgvector, and runs `drizzle-kit push` — but the **test step is `if: false`, so no tests actually run in CI**. Don't assume CI validates your change.
- `CODEOWNERS`: everything → `@SodaBeats`.

## Conventions (frontend styling)

- Colors: single source of truth is `src/theme/colors.js`; `tailwind.config.js` exposes tokens as Tailwind utilities (`bg-surface`, `text-ink`, `border-muted/20`), emits `:root` vars (`var(--surface)`, `rgb(var(--accent-rgb) / 0.4)` via `--*-rgb` channels), and `colors.*` for inline styles — **never raw hex outside `colors.js`** (status colors are the exception: Tailwind defaults like `red-400`/`green-600`/`amber-500`).
- Palette facts: **13 tokens**, despite the header comment still saying "flat 5-token palette" — trust the object. `accent` is brand **red** (`#A01412`); solid primary buttons are `accept` green (`bg-accept hover:bg-green-600`).
- Design: no gradients, no box-shadows (the single `box-shadow` is a focus ring); radius tops out at `rounded-lg` (cards) / `rounded-md` (buttons, inputs), `rounded-full` only for true circles.
- Fonts: Google Fonts `@import` blocks are copy-pasted into inline `<style>` in ~15 JSX files (Baloo 2 / Space Grotesk / Inter) — plan Phase 1 will centralize them; don't invent a second pattern.

## Known Gotchas (read before touching these areas)

- TanStack Query: `cacheTime` is dead — it's `gcTime` now. `staleTime` is set per call today (typically 5 min; `FileViewer` uses 30 min + `refetchOnMount: false`) — avoid `staleTime: Infinity`-style settings that can permanently cache a bad transient state; plan Phase 2 centralizes defaults.
- Drizzle: `pgTable`'s third argument must be an **array**, not an object (see `quiz_access_db` in `src/db/schema.js`); `primaryKey()` requires a `name` property.
- SQL: plain INNER JOINs silently drop zero-attempt records — use LEFT JOIN where absence is meaningful (see `QuizAttemptsRepository`).
- Backend: `db.ts` has a `pool.on('error')` listener to survive Neon idle-connection errors — keep it if you touch pools.

## Baseline at HEAD (re-verified 2026-10-14)

- Backend: `npx tsc --noEmit` ✓ and `npm test` ✓ (3 suites / 10 tests).
- Frontend: `npm run lint` ✓ and `npm run build` ✓ (the 500 kB chunk-size warning is expected).
- If any of these fail before you change something, that's new information — update this section.
