# Frontend Refactor Plan

Status: active plan — derived from `docs/frontend-architecture.md` (§3 target architecture, §4 migration plan).
Scope: `frontend/` only. Backend and API contracts are out of scope.

Rules that apply to every phase:

- Each phase is independently shippable: `npm run lint` + `npm run build` stay green at the end of it.
- Do not start a phase before the previous one lands.
- Never combine a folder move and a logic change in the same PR.
- No behavior changes in Phases 1–3; if a phase needs one to land, split it into its own PR.
- Non-goals (see architecture doc §5): no TypeScript, no Redux/Zustand, no router rewrite, no CSS-framework or component-library change.

Target structure (summary — full layout in architecture doc §3.2):

```
src/
├── app/          # router, guards (RequireRole), providers (Auth, Query)
├── lib/          # env, api client, queryClient defaults, query key factory
├── features/     # auth, quizzes, classes, documents, student-quiz (api/ + components/ + pages/)
├── components/   # ui/ (dumb, reusable) + layout/ (AppShell, topbars)
├── hooks/        # generic UI hooks
├── styles/       # index.css + components.css (@layer recipes)
└── theme/        # colors.js (unchanged)
```

Dependency rules to enforce (architecture doc §3.3):

- `lib/` imports nothing (no React, no features).
- `components/ui` imports nothing from `features/` and never touches HTTP or env vars.
- Features talk to the server only through their own `api/` layer.
- One owner per concern: one API client, one query-key factory, one env read, one toast/confirm vocabulary, one font declaration.

---

## Phase 0 — Safety net (no code movement)

Goal: make the refactor verifiable. The frontend has no tests, so a manual checklist is the primary safety net.

- [ ] Record a manual smoke checklist covering all 9 routes, happy path + one failure path each:
  - login/logout for both roles
  - upload → forge quiz → edit question → view results
  - classes CRUD
  - student token → answer → submit
- [ ] Baseline `npm run lint` and `npm run build` at HEAD; record results.
- [ ] Optional: add Vitest + React Testing Library and cover only the 3 flows that will be touched heavily later — quiz submit payload, `apiFetch` error normalization, `RequireRole`.

Findings addressed: none directly — this phase exists because there is no test suite (F-level gaps around verification).

Exit criteria: checklist exists, baseline recorded and green.

---

## Phase 1 — Foundations (purely additive, visually identical)

Goal: build the shared plumbing and UI primitives without changing any call site yet.

- [ ] **Single env read (fixes F3).** Create `lib/env.js` exporting `backendHost` + `isConfigured`; read `import.meta.env.VITE_BACKEND_HOST` in exactly one place. Move the `!backendHost` checks out of components — one check at the entry (`main.jsx` mounts `ErrorPage` instead of 10 components doing `<Navigate to="/error">`).
- [ ] **API client (fixes F2, part of F18).** Create `lib/api.js` with `createApiClient({ getAccessToken, refresh, onUnauthorized })` → `apiFetch` + `ApiError`. Port `authFetch`'s single-flight refresh logic verbatim. `AuthProvider` keeps its public API (`authFetch` re-exported as a shim) so no call site changes yet. The repeated `response.ok` / error-JSON boilerplate now lives in one place; `credentials: "include"` is always set by the client.
- [ ] **Fonts declared once (fixes F12).** Add `fontFamily` entries (`display` = Baloo 2, `displayAlt` = Space Grotesk, `body` = Inter) to `tailwind.config.js`; move the Google `@import` to the top of `src/styles/index.css`; delete all 17 copy-pasted inline `<style>` blocks from JSX. This also fixes the Baloo 2 vs Space Grotesk conflict (order-of-mount dependent display font today).
- [ ] **Shared class recipes (fixes F13).** Create `styles/components.css` with `@layer components` recipes: `.btn-primary`, `.btn-secondary`, `.input-well`, `.panel`, `.modal-panel`. Replace the duplicated `primaryBtnClass` / `wellInputClass` / `modalPanelClass` / `secondaryBtnClass` constants file-by-file. Use only `theme/colors.js` tokens — no raw hex, no gradients, no shadows.
- [ ] **UI primitives (fixes F14 groundwork).** Add `components/ui/`: `Modal` (portal + Escape + click-outside + focus trap + scroll lock), `Button` (primary | secondary | ghost | danger), `ConfirmDialog` (replaces `window.confirm()`), `Dropdown` (replaces the 5 hand-rolled click-outside menus), `Spinner`, `EmptyState`, `ErrorState`, `PanelTabs`; add `hooks/useClickOutside`.

Exit criteria: app visually identical; zero `<style>@import` blocks in `src/**/*.jsx`; no duplicated `primaryBtnClass`-style declarations; no behavior change.

---

## Phase 2 — Data layer (highest bug payoff)

Goal: one cache, one client, one error vocabulary. Server state belongs to React Query.

- [ ] **Query key factory (fixes F1).** Create `lib/queryKeys.js` (`quizKeys`, `classKeys`, `docKeys`, `attemptKeys`) and rename keys so each endpoint has exactly one key:
  - merge `["queryQuestions", quizId]` and `["quizQuestions", quizId]` → `quizKeys.questions(id)`
  - merge `["queryQuizzes"]` and `["userQuizzes", page]` → `quizKeys.list(params)`
  This kills the stale-list bugs (invalidations written on one side never reached the other).
- [ ] **Global QueryClient defaults (fixes F5).** Create `lib/queryClient.js` with `staleTime: 5 * 60_000`, `refetchOnWindowFocus: false`, `retry: 1`; delete per-call `staleTime` / `refetchOnWindowFocus` overrides across the ~12 `useQuery` calls.
- [ ] **Per-feature API layer (fixes F2, F3, F6).** For each feature (quizzes, classes, documents, student-quiz, auth) create `api/<f>.api.js` (move the 3 existing service modules + all inline fetchers out of JSX), `api/queries.js`, `api/mutations.js`. Remove the `response.ok` boilerplate and string-matching on error text (`"Unauthorized action"` in `QuizResultDashboard`).
- [ ] **Mutations via `useMutation` (fixes F4).** Convert the ~6 hand-rolled optimistic-update handlers (`handleDeleteQuiz`, `handleQuizMetaUpdate`, `handleQuestionUpdate` in `QuizzesPage`; 2 in `ClassesPage`; `handleQuestionDelete` in `SideBar`) to `useMutation` with `onMutate`/`onError`/`onSettled`. Because `quizKeys.all` is a prefix, an edit in the quiz maker now invalidates the quizzes page automatically. Convert the 4 plain fetch-then-invalidate handlers in `ClassesPage` too.
- [ ] **One feedback vocabulary (fixes F16, part of F6).** Replace every `alert()` (7 files: `Login`, `QuizMakerPage`, `SideBar`, `TopBar`, `StudentQuizPage`, `StudentTokenInput`, `StudentTokenPage`) with `toast`; replace every `window.confirm()` (6 files) with `ConfirmDialog`. Centralize server-error → message mapping (`queryClient.onError` or a `useApiError()` helper → `toast.error(err.message)`).

Exit criteria: `grep "fetch("` returns hits only in `lib/api.js` and `features/*/api/*.js`; exactly one query key per endpoint; no `alert(` and no `window.confirm(` anywhere in `src`.

---

## Phase 3 — Structure

Goal: feature-first folders and clean file boundaries. Mechanical moves + import updates, no logic changes.

- [ ] **Create `features/` and move files (fixes F7, F8, F9).** Move `pages/` + `components/` into `features/{auth,quizzes,classes,documents,student-quiz}/` per the target layout (one feature per PR; IDE-aware moves).
- [ ] **Extract app shell (fixes F8, F19).** Route table → `app/router.jsx`; the two inline guards → `app/guards/RequireRole.jsx` (replaces `ProtectedRoute` + `StudentRoute`, redirects with `state: { from: location }` so re-login returns to the requested page, and wrong-role access goes to the right home instead of `/login`); providers → `app/providers/` (`AuthProvider` = token/user state + session lifecycle only, `QueryProvider`, composed `AppProviders`). Add route-level `errorElement`.
- [ ] **One component per file (fixes F7, F9).** Split out: `CreateClassModal`, `AddStudentModal`, `QuizForgeModal`, `ClassAccessibilityDropdown`, `FileModal`, `SelectQuizModal`, `ClassAccessDropdown`, `NoFileIcon`; extract the 2 modals out of `SideBar.jsx` and `QuestionEditor.jsx`'s helpers. Target: no file over ~300 lines except intentionally complex ones.
- [ ] **Fix naming drift (fixes F10).** While moving: `QuizMakerSkeleton` → match `QuizMakerPage`, drop `LogInComponent` alias, fix `export default function SudentTopbar`, rename `QuizTokenModal` (exported from `StudentTokenInput.jsx`), rename `toDatetimeLocal` in `toDateTimeLocal.js`. Adopt conventions: `PascalCase.jsx` components, `camelCase.js` non-components, named `export function Foo()`.
- [ ] **Split `TopBar.jsx` (fixes F7/F9).** Break it into brand + profile menu + create-quiz action so `QuizMakerPage`'s props (`selectedFile`, `setQuizMetadata`) stop leaking into every page's top bar (today `QuizzesPage` renders `<TopBar />` with both props undefined).

Exit criteria: no file over ~300 lines (except intentional); `components/ui` imports nothing from `features/`; guards live in one file.

---

## Phase 4 — UX consistency pass

Goal: one responsive shell and uniform state feedback.

- [ ] **Responsive shell (fixes F15).** Replace the 4 duplicated `mobileTab` switchers (`QuizzesPage`, `ClassesPage`, `QuizMakerPage`, `QuizResultDashboard`) with `<AppShell panels={[…]}>` / `PanelTabs`.
- [ ] **Uniform loading/empty/error states.** Every modal and page uses `Spinner`, `EmptyState`, `ErrorState` instead of inventing its own overlay.
- [ ] **Attempt storage helpers (fixes F20).** Move the bespoke `sessionStorage` read/write/clear from `StudentQuizPage` + `StudentTimeLimit` into `features/student-quiz/lib/attemptStorage.js` with typed helpers (`loadAnswers`, `saveProgress`, `clearAttempt`) and one namespaced key scheme — no more ad-hoc keys or cleanup loop scanning every key.

Exit criteria: one implementation of the mobile panel switcher; no direct `sessionStorage` access outside `attemptStorage.js`.

---

## Phase 5 — Cleanup / optional

Goal: pay down size/duplication debt that wasn't blocking earlier phases.

- [ ] Split `Login.css` (1,639 lines) and `StudentTokenPage.css` (748 lines) into colocated, component-scoped sheets; move shared card/input recipes into `components.css` first so leftovers are genuinely page-specific (fixes F17).
- [ ] Prune unused assets (duplicate `*_clean` / `*_crop` / `*_perfect` variants of the same image).
- [ ] Consider `React.lazy` for heavier routes (chart.js only needed on the results dashboard).
- [ ] Consider boundary lint rules (architecture doc §3.3): `no-restricted-imports` banning raw `fetch(` outside `lib/api.js` + `features/*/api/*.js`, and banning `authFetch` imports from `components/ui` (fixes F11).

Exit criteria: `Login.css` / `StudentTokenPage.css` gone or reduced to page-specific rules; lint rules encode the dependency diagram.

---

## PR slicing

| PR    | Contents                                                        | Risk                          |
| ----- | --------------------------------------------------------------- | ----------------------------- |
| 1     | Phase 0 checklist + Vitest scaffold                             | none                          |
| 2     | Fonts + `@layer components` style recipes (Phase 1.3–1.4)       | low, visual review            |
| 3     | `lib/env.js` + `lib/api.js` + `AuthProvider` slimming (1.1–1.2) | medium, auth paths            |
| 4     | `components/ui` primitives + swap modals/dropdowns (Phase 1.5)  | low–medium                    |
| 5     | Query key factory + key unification (Phase 2.1–2.2)             | **high payoff**, medium risk  |
| 6+    | Per-feature `api/queries/mutations` extraction (Phase 2.3–2.4) | one PR per feature, low each  |
| n     | `features/` folder moves (Phase 3)                              | one feature per PR, mechanical|
| last   | Shell/`PanelTabs`, alert cleanup, CSS split (Phase 4–5)         | low                           |
