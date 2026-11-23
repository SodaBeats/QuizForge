# AGENTS.md

## Repo shape

- Two independent npm packages, **no root package.json / no workspaces**: `backend/` and `frontend/`. Run every npm command from inside those directories.
- **Backend** — Express 5 + TypeScript ESM (`"type": "module"`), Drizzle ORM + Postgres. Entry: `src/index.ts` (listens on `:3000`) → `src/server.ts`, which mounts all routes (`/api/*`, `/auth/*`) and the central error handler. Layers: `routes/ → middlewares/ → services/ → repository/ → db/`.
- **Frontend** — React 19 + Vite 7, **plain JS/JSX: no TypeScript and no typecheck script** (the `frontend/README.md` TypeScript notes are stock Vite-template boilerplate). Entry `src/main.jsx` → `src/app/App.jsx` → `src/app/router.jsx`; route guards are centralized in `src/app/guards/RequireRole.jsx`. Tailwind 3. Server state lives behind `features/<feature>/api/` (`*.api.js` + `queries.js` + `mutations.js`); shared plumbing is `lib/env.js`, `lib/api.js`, `lib/queryKeys.js`, `lib/queryClient.js`. Pages/components never call `fetch` or read `VITE_BACKEND_HOST` directly.
- `README.md` is truncated mid-"Getting Started" — it contains no run/test instructions. Trust package.json/scripts over docs.
- **Active frontend refactor**: `docs/frontend-refactor-plan.md` (status: active, phases 0–5), derived from `docs/frontend-architecture.md`. Rules: `npm run lint` + `npm run build` green at the end of every phase; one phase per PR; never combine a folder move with a logic change; no behavior changes in Phases 1–3; non-goals: no TypeScript, no Redux/Zustand, no router rewrite. Don't kick off uncoordinated refactors — follow this plan or ask. Progress: **Phase 0 merged as PR #27** (2026-10-15 — smoke checklist `docs/smoke-checklist.md` executed & signed off, Vitest added); **Phase 1 merged as PR #28** (2026-10-23 — env/client/fonts/UI primitives); **Phase 2 data-layer implementation complete** (2026-10-24); **Phase 3 structure implementation complete** on `refactor/phase-3-structure` (2026-10-31 — lint/build/test pass; full manual smoke re-run still pending because the local backend/API was not running). Phase 3 is not yet merged. (Historical: the earlier `refactor/phase-1` PR #26 was a _visual_ restyle, not plan-Phase 1.)
- **Admin panel**: plan lives in `implementation-steps.md` (repo root) — written for **both sessions** (backend contract + phased execution; the contract reference section is the source of truth). Delivery rule for this feature: **one commit per phase, gates green at each STOP; a single PR once the feature works end-to-end** (this does *not* follow the refactor plan's one-phase-per-PR rule). Frontend scaffold exists in `frontend/src/features/admin/`; the temporary mock layer was removed in Phase 4 after the live `/admin` cutover.
- Stale docs (don't trust): `docs/past-changes/frontend-refactor-notes.md` is a copy of an older AGENTS.md (flat `pages/`/`components/` layout, `reference.jsx`). `backend/TEST_RUN_TROUBLESHOOTING.md` describes a Jest config problem that has since been fixed.

## Commands

Backend (`backend/`):

- `npm run dev` — dev server on `:3000` (`tsx watch`). This is the only way to run it: `npm run build` is `tsc` with `noEmit: true` (`outDir` commented out), so it emits nothing and `npm start` (`node dist/index.js`) can never work.
- `npx tsc --noEmit` — typecheck. There is **no backend lint/format script** and no backend ESLint config.
- `npm test` (= `npm run test:unit`) — unit suite, no DB needed.
- `npm run test:int` — integration suite (prereqs below).
- Filter tests: `npm test -- --testPathPatterns <regex>`. Jest 30 renamed the flag — the singular `--testPathPattern` fails with "Option was replaced".

Frontend (`frontend/`):

- `npm run dev` (Vite, default `:5173`), `npm run lint`, `npm run build`, `npm run preview`, `npm test` (Vitest; suites live in `frontend/src/tests/*.test.jsx` — small by design, a refactor safety net, not coverage). Verification for any frontend change: `npm run lint` + `npm run build` + `npm test`.

Prettier config sits at the repo root (`.prettierrc`: semi, tabWidth 2); no format script exists.

## Environment / services

- Backend reads `backend/.env` (dotenv, at import). **Hard-required at import time** (`src/db/db.ts`): `DATABASE_URL`, `JWT_SECRET`, `REFRESH_TOKEN_SECRET`. Also used: `AI_API_KEY` (chat-completions AI — the OpenAI-compatible client lives in `src/lib/aiClient.ts`; env is read at call time so *importing* it (e.g. in unit tests) needs no key; `index.ts` calls `assertAiConfigured()` at boot so the server still fails fast if it's missing; switch providers via `AI_BASE_URL`/`AI_MODEL` — defaults stay on Groq `https://api.groq.com/openai/v1` + `openai/gpt-oss-120b`, plus optional `AI_TIMEOUT_MS`), `CORS_ORIGIN` (defaults to `http://localhost:5173`).
- **Embeddings** are centralized in `src/lib/embedText.ts` — the only module that knows the provider (transport: global `fetch`; the `ollama` npm package was removed). Switch with `EMBEDDING_PROVIDER` (`ollama` default, local dev | `jina`, production) plus `EMBEDDING_MODEL`/`OLLAMA_HOST` (ollama) or `JINA_API_KEY` + `JINA_EMBED_MODEL` (required when provider=jina), `JINA_BASE_URL`, `EMBEDDING_TIMEOUT_MS` (plain integer ms). `index.ts` calls `assertEmbeddingConfigured()` at boot so a bad config fails fast (mirrors `assertAiConfigured()`). **Never flip providers on a populated DB** — both are 1024-dim, so mixed vectors fail silently (garbage retrieval, no error); full checklist in `docs/embedding-deployment.md`.
- **Redis rate limiting is bypassed in local development** (`NODE_ENV=development`): `src/middlewares/redis.ts` skips client creation, and both limiter middlewares call `next()` without Redis. Test and production modes still require `REDIS_URL` and use Redis. `server.ts` currently leaves `ipRateLimiter` unmounted; `userBasedRateLimiter` is used on most routes.
- Migrations: **no committed migration files** — `/backend/src/db/migration/` is gitignored. `npm run db:migrate` = `drizzle-kit push` (schema push is the source of truth; `npm run db:generate` writes SQL files locally).
- Fresh clone: `backend/.env`, `backend/.env.test`, and `frontend/.env` are all gitignored — copy the tracked `.env.example` files. `frontend/.env` needs `VITE_BACKEND_HOST=http://localhost:3000`; it is read only in `src/lib/env.js` (Phase 1).

## Testing quirks

- Configs: `jest.config.js` → re-exports `jest.config.unit.js` (default run = unit). `jest.config.integration.js` adds `globalSetup`/`globalTeardown`/`loadEnv`. Base is ESM + ts-jest, so jest must run via `node --experimental-vm-modules ...` — the npm scripts already do this; don't hand-roll jest commands.
- Layout: unit tests `src/tests/unit/*.unit.test.ts`, integration `src/tests/integration/*.int.test.ts`.
- Unit suite is pure (10 suites / 71 tests) — needs no DB, Redis, or API keys (the `embedText` suite stubs `fetch`).
- Integration prerequisites: a pgvector Postgres reachable via **`backend/.env.test` → `DATABASE_URL`** (filled 2026-11-17 with an owner-confirmed **disposable** Neon DB — `globalSetup` pushes schema and truncates every table, so never point it at real data). No Redis needed. `globalSetup.ts` itself runs `npx drizzle-kit push`, truncates every table, and seeds:
  - `teacher@test.com` / `TeacherPass1!`
  - `student@test.com` / `StudentPass1!`
  - `student2@test.com` / `Student2Pass2!`
- Since the isVerified guard (2026-11-21), `verifyTeacher` 403s unverified teachers with `{ message: "Awaiting verification" }` — the seeded `teacher@test.com` and `dashboard.int.test`'s own teachers are seeded `is_verified: true`, and `admin.int.test.ts` seeds its own pending (unverified, active) teacher for the `verified=false` list test. Keep new teacher fixtures explicit about `is_verified`.
- **Gotcha**: create the `vector` extension on the test DB _before_ running `test:int` — `globalSetup` pushes the schema before it creates the extension (CI does extension → push for the same reason).
- Shared helpers (`loginAs`, `authHeader`, `*_CREDS`, `generateShareToken`) live in `src/tests/integration/setup/testHelpers.ts`.
- Frontend vitest: `lib-env.test.jsx` imports `main.jsx` (the whole app tree) inside the default 5s timeout — adding a **new** test file that imports `AppRoutes` pushes it over the limit under parallel load (seen 2026-11-21: suite went red with a `lib-env` timeout, green again once the tests were folded into `app-teacher-routes.test.jsx`). Consolidate AppRoutes-based tests into existing files instead of adding new ones.

## CI

- Only workflow: `.github/workflows/integration-tests.yml` (on PRs). It installs backend deps, enables pgvector, and runs `drizzle-kit push` — but the **test step is `if: false`, so no tests actually run in CI**. Don't assume CI validates your change.
- `CODEOWNERS`: everything → `@SodaBeats`.

## Conventions (frontend styling)

- Colors: single source of truth is `src/theme/colors.js`; `tailwind.config.js` exposes tokens as Tailwind utilities (`bg-surface`, `text-ink`, `border-muted/20`), emits `:root` vars (`var(--surface)`, `rgb(var(--accent-rgb) / 0.4)` via `--*-rgb` channels), and `colors.*` for inline styles — **never raw hex outside `colors.js`** (status colors are the exception: Tailwind defaults like `red-400`/`green-600`/`amber-500`).
- Palette facts: **13 tokens**, despite the header comment still saying "flat 5-token palette" — trust the object. `accent` is brand **red** (`#A01412`); solid primary buttons are `accept` green (`bg-accept hover:bg-green-600`).
- Design: no gradients, no box-shadows (the single `box-shadow` is a focus ring); radius tops out at `rounded-lg` (cards) / `rounded-md` (buttons, inputs), `rounded-full` only for true circles.
- Fonts: one Google Fonts `@import` in `src/styles/index.css`; families are Tailwind tokens (`font-display` = Baloo 2, `font-displayAlt` = Space Grotesk, `font-body` = Inter). Don't add inline font imports.

## Known Gotchas (read before touching these areas)

- TanStack Query: `cacheTime` is dead — it's `gcTime` now. Defaults live in `src/lib/queryClient.js` (`staleTime` 5 min, `refetchOnWindowFocus: false`, `retry: 1`); don't re-add per-call `staleTime`/`refetchOnWindowFocus` overrides. Keys live in `src/lib/queryKeys.js` — prefix invalidation (`quizKeys.all`, `quizKeys.lists`) is what keeps the quiz maker and quizzes page in sync. Avoid `staleTime: Infinity`-style settings that can permanently cache a bad transient state.
- Drizzle: `pgTable`'s third argument must be an **array**, not an object (see `quiz_access_db` in `src/db/schema.js`); `primaryKey()` requires a `name` property.
- SQL: plain INNER JOINs silently drop zero-attempt records — use LEFT JOIN where absence is meaningful (see `QuizAttemptsRepository`).
- Backend: `db.ts` has a `pool.on('error')` listener to survive Neon idle-connection errors — keep it if you touch pools.

## Baseline at HEAD (backend gates re-verified 2026-11-21 incl. integration; frontend gates re-verified 2026-11-21; frontend teacher-dashboard scaffold smoke 2026-11-05; frontend exam-attempts smoke 2026-11-07)

- Backend: `npx tsc --noEmit` ✓ and `npm test` ✓ (**10 suites / 71 tests**), re-verified 2026-11-21 (5 are the new `teacherAuthz.unit.test.ts` from the isVerified-guard work; the rest grew from the 6/51 of 2026-11-17 via admin-panel suites — 18 are the `embedText` suite, 16 the `textUtilities` chunking tests; history: 5 suites / 33 tests on 2026-11-16, 4 suites / 17 tests on 2026-11-12 at committed HEAD `df43c6b` + `d968017`). **`npm test` needs no API key**: PR #37/`d358aaf` (2026-11-14) had made `src/lib/groq.ts` throw at *import*, failing `getReasoningScoreObject.unit.test.ts` whenever `GROQ_API_KEY` wasn't in the process env — fixed 2026-11-16 with lazy `getGroq()` + boot-time `assertGroqConfigured()` in `index.ts` (server still fails fast on a missing key). **Integration suite run**: 2026-11-21 ✓ — **8 suites / 101 tests** against the disposable Neon DB (was 6/67 on 2026-11-17; +`admin.int.test.ts` from Admin Phase 2, +`teacherAuthz.int.test.ts` from the isVerified-guard work — its `globalSetup` teacher/dashboard seeds are now `is_verified: true`, and `admin.int.test.ts` seeds its own pending teacher for the `verified=false` list test). `quizSubmit.int.test.ts` is verified (Groq-dependent paths log expected errors under the dummy test key). (History: `tsc` was red at `eef0335` on 2026-11-11 — enum→union breakage — fixed in implementation-steps Phase 0.)
- Frontend: `npm run lint` ✓, `npm run build` ✓ (largest chunk 454.88 kB — the old 500 kB size warning no longer fires). `npm test` = **33 files / 204 tests: 196 passing + the 8 pre-existing failures at HEAD**, re-verified 2026-11-23: 2 from merge `39a84c2` (PR #35 color/design) — `ui-spinner` default-tone assertion (`border-spinnergreen` vs expected `border-accent`) and `student-quiz-submit-payload` submit-mock timeout — verified pre-existing 2026-11-12, plus **6 in `attempt-storage.test.jsx`** (`clearAttempt` without attemptId doesn't clear progress; `getTimerStart` persist/reset assertions) discovered 2026-11-23 — verified pre-existing at clean HEAD via `git stash` (root cause uninvestigated, likely from the `3cdeb75`/`2c19622` student-workspace work) — treat all 8 as the baseline; new work must not add failures. Counts re-verified 2026-11-21: the isVerified guard (`RequireVerified` + `/awaiting-verification`) added 6 tests, folded into `app-teacher-routes.test.jsx` rather than a new AppRoutes suite (see the lib-env timeout gotcha under Testing quirks) — **owner smoke of the guard still pending**. History: 188/186 on 2026-11-20 after the admin mock layer was removed in Phase 4; 194/192 on 2026-11-19 after the admin-panel scaffold added `app-admin-routes.test.jsx` (6) and `admin-api-mocks.test.jsx` (7). The new-question-types attempt-review frontend follow-up (`implementation-steps.md` F1–F4) had its gates re-verified 2026-11-12 — **owner smoke still pending**. Teacher dashboard full smoke passed 2026-11-05 (owner-run). Phase 3's full manual smoke re-run remains pending.
- If any of these fail before you change something, that's new information — update this section.
