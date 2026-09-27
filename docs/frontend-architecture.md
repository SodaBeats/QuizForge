# Frontend Architecture Recommendations

Status: proposal (review + target architecture + migration plan) — **except the visual language, which is implemented** (see §3.4 note)
Scope: `frontend/` only. Backend and API contracts are out of scope.
Baseline: ~9,800 lines across 39 files in `frontend/src` (largest: `Login.css` 1,639, `QuestionEditor.jsx` 802, `ClassesPage.jsx` 671, `SideBar.jsx` 664, `TopBar.jsx` 617).

This doc has four parts: **(1)** what the code looks like today, **(2)** findings worth fixing, **(3)** the recommended target architecture, **(4)** a phased migration plan that keeps the app shippable at every step.

---

## 1. Current state

### Layers (as they actually are)

```
main.jsx  →  BrowserRouter → AuthProvider → QueryClientProvider → App (route table)
pages/    →  components/  →  services/  →  fetch(authFetch)  →  backend
```

| Area         | Today                                                                                                                                    |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Routing      | Route table + two inline guards (`ProtectedRoute`, `StudentRoute`) in `src/App.jsx`                                                      |
| Server state | TanStack Query 5, but only partially: some fetches are `useQuery`, many are hand-rolled `fetch` inside components                        |
| Auth         | `components/AuthProvider.jsx`: token state + silent refresh + `authFetch` HTTP client + `logout`, all in one context                     |
| Styling      | Tailwind 3 + centralized palette (`src/theme/colors.js` → `tailwind.config.js` → `:root` vars) + 3 hand-written CSS files                |
| API          | 3 service modules (`classServices`, `documentServices`, `studentQuizService`); everything else calls `authFetch` directly from JSX files |
| Toasts       | `react-hot-toast` installed, but `alert()` (7 files) and `window.confirm()` (6 files) are still used alongside it                        |

### What is already good — keep it

- **Centralized color tokens** (`src/theme/colors.js` + the `colorVarsPlugin` that emits CSS vars). This is the right pattern; extend it rather than replace it.
- **Feature-ish folder split** of `pages/` and `components/` into `teacher/` + `student/` (done in a recent refactor). The direction is right; it just needs to go one level further.
- **TanStack Query is already a dependency and already used** in ~10 places, with sensible `staleTime` and real optimistic updates in `QuizzesPage` / `ClassesPage`. The migration is "finish the job", not "introduce a library".
- **`authFetch` with single-flight silent refresh** (refresh promise de-dup via `refreshPromiseRef`) is a correct design. It just needs to move out of the React context and become a plain module.
- **`react-hot-toast` is already wired** (`<Toaster />` in `App.jsx`); the remaining `alert()` calls are leftovers, not a missing dependency.

---

## 2. Findings

Grouped by theme. Each is concrete and verifiable in the current tree.

### 2.1 Data layer

**F1 — Two caches for the same endpoint (real staleness bug).**
The same URL `/api/quizzes/questions?quizId=…` is cached under two unrelated keys:

- `["queryQuestions", quizId]` — `pages/teacher/QuizzesPage.jsx:175`
- `["quizQuestions", quizId]` — `pages/teacher/QuizMakerPage.jsx:104`, `components/teacher/SideBar.jsx:397`, `components/teacher/QuestionEditor.jsx:153`

Invalidations written on one side (`invalidateQueries({ queryKey: ["quizQuestions", …] })` in `QuestionEditor`) never reach the other, so `QuizzesPage` can render a stale question list after an edit.

Same story for the quiz list: `["queryQuizzes"]` (unpaginated, `QuizzesPage.jsx:63`) vs `["userQuizzes", page]` (paginated, `SideBar.jsx:187`) both hit `/api/quizzes`. Deleting a quiz rolls back `queryQuizzes` only; `userQuizzes` keeps the deleted row in cache.

**F2 — Fetch/error boilerplate duplicated ~20 times.**
Every call site repeats this shape:

```js
const response = await authFetch(url, { credentials: "include" });
if (!response.ok) {
  const result = await response.json();
  throw new Error(
    result.errors?.map((e) => e.msg).join(", ") ||
      result?.message ||
      "failed to …",
  );
}
return await response.json();
```

It appears in all 3 services and inline in `QuizzesPage`, `QuizMakerPage`, `SideBar`, `QuestionEditor`, `TopBar`, `ClassesPage`, `QuizResultDashboard`. Drift is inevitable (and already present: `QuizzesPage.fetchQuestions` omits `credentials: "include"` at line 43, unlike its siblings).

**F3 — `backendHost` + `!backendHost` guard repeated 14 / 11 times.**
`const backendHost = import.meta.env.VITE_BACKEND_HOST;` is read in 14 files (and read _inline_ twice more in `AuthProvider`), and the `!backendHost` check is repeated in 11 files — 10 components do `if (!backendHost) return <Navigate to="/error" replace />;`, `StudentTokenPage` throws, and `AuthProvider` navigates in an effect. Several of those are non-route components (`SideBar`, `TopBar`, `QuestionEditor`, `FileViewer`), where a missing env var should never be a per-component concern.

**F4 — Mutations are hand-written inside pages.**
Optimistic update + snapshot + rollback + toast is re-implemented by hand in ~6 handlers (`handleDeleteQuiz`, `handleQuizMetaUpdate`, `handleQuestionUpdate` in `QuizzesPage`; 2 more in `ClassesPage`; `handleQuestionDelete` in `SideBar`), plus 4 more plain fetch-then-invalidate handlers in `ClassesPage`. React Query `useMutation` already models exactly this with `onMutate` / `onError` / `onSettled`.

**F5 — React Query is configured with defaults and then overridden everywhere.**
`new QueryClient()` in `main.jsx` has no defaults; each of the ~12 `useQuery` calls re-specifies `staleTime: 1000 * 60 * 5`, some specify `refetchOnWindowFocus: false`, some don't (inconsistent focus-refetch behavior between pages).

**F6 — Mixed response handling.** `QuizResultDashboard.fetchDashboardData` (`:81`) calls `.json()` on responses without checking `response.ok`, then string-matches `"Unauthorized action"` to decide whether to log out — auth decisions scattered into business code.

### 2.2 Structure

**F7 — God files.** `QuestionEditor.jsx` (802 lines, 1 component + helpers), `ClassesPage.jsx` (671, 3 components), `SideBar.jsx` (664, 3 components incl. 2 modals), `TopBar.jsx` (617, 3 components incl. a 180-line modal).

**F8 — Infrastructure mixed with UI.** `AuthProvider` and `RootRedirector` sit in `components/` next to presentational widgets; route guards are inline in `App.jsx`.

**F9 — Page files exporting unrelated components.** `ClassesPage.jsx` exports only the page but defines `CreateClassModal` + `AddStudentModal` locally; `TopBar.jsx` hides `QuizForgeModal` + `ClassAccessibilityDropdown`.

**F10 — Naming drift.** `QuizMakerSkeleton` (file `QuizMakerPage.jsx`), `LogInComponent`, `export default function SudentTopbar` (typo), `QuizTokenModal` exported from `StudentTokenInput.jsx`, `toDatetimeLocal` exported from `toDateTimeLocal.js`. Harmless alone; expensive when you are navigating by name during a refactor.

**F11 — No boundary rules.** Any component may import any other, call `fetch`, or reach into `import.meta.env`. Nothing enforces the layering the codebase pretends to have.

### 2.3 Styling & UI

**F12 — Fonts re-imported inline in 17 places.**
The same `<style>{\`@import url('https://fonts.googleapis.com/…'); .font-display{…}; .font-body{…}\`}</style>`block is copy-pasted into 15 files (17 blocks —`FileViewer`and`QuizzesQuestionList`have two each). Worse, the rule is **not consistent**:`QuizMakerPage.jsx:126`and`QuizResultDashboard.jsx:237`define`.font-display`as *Space Grotesk* while everything else defines it as *Baloo 2*. These are global, unscoped rules — on`/teacher`, both are injected (page + `TopBar`+`SideBar` + …) and the last one in the document wins for the entire page. The display font is currently order-of-mount dependent.

**F13 — Button/input/panel class constants duplicated.**
`primaryBtnClass`, `wellInputClass`, `modalPanelClass`, `secondaryBtnClass` are re-declared in `ClassesPage`, `TopBar`, `SideBar`, `QuestionEditor`, `QuizzesMetadata`, `QuizzesSideBar` — with small variations that have already drifted (hover states, disabled states). (The old `primaryBtnStyle` gradient/shadow objects were deleted in the flat redesign; accent buttons are now a plain `bg-accent text-canvas` class.)

**F14 — Hand-rolled modals and dropdowns.** Every modal re-implements the dimmed overlay + panel + `×` button + (sometimes) a `mousedown` document listener; there are 5 copies of the `document.addEventListener("mousedown", …)` click-outside effect (`TopBar` ×2, `QuizzesMetadata`, `StudentInfoModal`, `StudentTopbar`). No Escape-to-close, no focus trap, no consistent scroll lock.

**F15 — The mobile panel switcher is duplicated 4×.** `mobileTab` state + the `flex lg:hidden` button strip + `${cond ? "flex" : "hidden"} lg:contents` wrappers appear in `QuizzesPage`, `ClassesPage`, `QuizMakerPage`, `QuizResultDashboard` with the same structure.

**F16 — Feedback inconsistency.** `toast.success/error` in some paths, `alert()` in `Login`, `QuizMakerPage`, `SideBar`, `TopBar`, `StudentQuizPage`, `StudentTokenInput`, `StudentTokenPage`; `window.confirm()` for destructive actions in 6 files (`QuizzesPage`, `ClassesPage` ×2, `SideBar`, `StudentSidebar`, `TopBar`). Two UX dialects in one app.

**F17 — Two monolithic stylesheets.** `Login.css` (1,639 lines) and `StudentTokenPage.css` (748) are unmaintainable as single files and repeat the same card/input recipes used elsewhere via Tailwind classes (they now carry the flat recipes — the clay gradients/shadows inside them were removed in the redesign, but the size and duplication problem stands).

### 2.4 Auth & routing

**F18 — `AuthProvider` does four jobs**: holds token/user state, performs refresh, exposes an HTTP client, and navigates on failure. Consumers therefore need the context even when they only want `userInfo`.

**F19 — Guards drop intent.** Both guards redirect to `/login` with no `state.from`, so after re-login the user lands on `/` instead of the page they requested. Also, a teacher hitting `/student` and a student hitting `/teacher` both silently land on `/login`.

**F20 — Session-progress storage is bespoke.** `StudentQuizPage` + `StudentTimeLimit` hand-roll `sessionStorage` read/write/clear for answers, current index, answered set, and timer, with keys built ad hoc and a cleanup loop scanning every key.

---

## 3. Target architecture

### 3.1 Guiding principles

1. **Feature-first folders, layer-second.** Group by domain (quizzes, classes, documents, student-quiz, auth), not by technical role, so a feature change touches one folder.
2. **One owner per concern**: one API client, one query-key factory, one place that reads env, one toast/confirm vocabulary, one font declaration.
3. **Server state belongs to React Query; UI state belongs to the component; auth belongs to one context.** No component calls `fetch` directly.
4. **Presentational components know nothing about HTTP or env vars.** They receive data and callbacks.
5. **Refactor incrementally** — every phase compiles, lints, and ships on its own. No big-bang rewrite.

### 3.2 Proposed directory layout

```
frontend/src/
├── main.jsx                       # mount + providers only
├── app/
│   ├── App.jsx                    # layout shell + <RouterProvider> / route outlet
│   ├── router.jsx                 # route table (route objects, lazy where useful)
│   ├── guards/
│   │   ├── RequireRole.jsx        # replaces ProtectedRoute + StudentRoute
│   │   └── RootRedirector.jsx
│   └── providers/
│       ├── AuthProvider.jsx       # token/user state + session lifecycle ONLY
│       ├── QueryProvider.jsx      # QueryClient with global defaults
│       └── index.jsx              # single composed <AppProviders>
│
├── lib/                           # framework-agnostic plumbing, no feature knowledge
│   ├── env.js                     # backendHost + isConfigured (single read of import.meta.env)
│   ├── api.js                     # createApiClient({ getToken, refresh, onUnauthorized })
│   │                              #   → apiFetch: base URL, credentials, JSON/FormData, ApiError
│   ├── queryClient.js             # QueryClient defaults (staleTime, retry, refetchOnWindowFocus)
│   └── queryKeys.js               # key factory (below)
│
├── features/
│   ├── auth/
│   │   ├── api/auth.api.js        # login, register, refresh, logout
│   │   ├── hooks/useAuth.js       # thin context selector
│   │   └── pages/LoginPage.jsx
│   ├── quizzes/                   # teacher: list, editor, results
│   │   ├── api/quizzes.api.js     # all /api/quizzes* fetchers
│   │   ├── api/queries.js         # useQuizzes, useQuizQuestions, useQuizDashboard…
│   │   ├── api/mutations.js       # useCreateQuiz, useUpdateQuiz, useDeleteQuiz…
│   │   ├── components/            # QuizzesSidebar, QuizzesMetadata, QuestionEditor,
│   │   │                          # FileViewer, modals (one per file)
│   │   └── pages/                 # QuizzesPage, QuizMakerPage, QuizResultDashboard
│   ├── classes/
│   │   ├── api/{classes.api.js,queries.js,mutations.js}
│   │   ├── components/            # ClassesSidebar, CreateClassModal, AddStudentModal, StudentInfoModal
│   │   └── pages/ClassesPage.jsx
│   ├── documents/                 # upload + file viewer + document list
│   │   ├── api/{documents.api.js,queries.js,mutations.js}
│   │   └── components/{FileViewer,DocumentPicker}.jsx
│   └── student-quiz/              # token entry, quiz taking, timer, submit
│       ├── api/{studentQuiz.api.js,queries.js,mutations.js}
│       ├── lib/attemptStorage.js  # sessionStorage helpers (F20)
│       ├── components/            # StudentSidebar, StudentQuizWindow, StudentTimeLimit, QuizTokenModal
│       └── pages/                 # StudentTokenPage, StudentQuizPage
│
├── components/
│   ├── ui/                        # dumb, reusable: no feature/HTTP imports
│   │   ├── Button.jsx             # variants: primary | secondary | ghost | danger
│   │   ├── Modal.jsx              # portal + esc + click-outside + focus trap
│   │   ├── ConfirmDialog.jsx      # replaces window.confirm()
│   │   ├── Dropdown.jsx           # replaces 5 hand-rolled click-outside menus
│   │   ├── PanelTabs.jsx          # replaces the 4× mobile tab switchers
│   │   ├── Spinner.jsx / EmptyState.jsx / ErrorState.jsx
│   │   └── fields/                # TextInput, OtpInput (student token), Select
│   └── layout/
│       ├── AppShell.jsx           # page frame: TopBar + content + responsive slots
│       ├── TeacherTopbar.jsx      # split: brand, profile menu, "Forge quiz" action
│       └── StudentTopbar.jsx
│
├── hooks/                         # useClickOutside, useMediaQuery, usePersistentState
├── styles/
│   ├── index.css                  # @tailwind + fonts + @layer components (see 3.4)
│   └── components.css             # .btn-primary, .input-well, .panel, .modal-panel…
├── theme/colors.js                # unchanged
└── assets/
```

### 3.3 Dependency rules (enforceable)

```
app/            → features/, components/, lib/
features/*      → components/ui, components/layout, lib/, hooks/, its own siblings
components/ui   → hooks/, styles tokens (colors)         ❌ features/*, ❌ lib/api
lib/            → (nothing in src; no React, no feature imports)
```

Concrete enforcement (cheap, no new deps):

```js
// eslint.config.js — add
"no-restricted-imports": ["error", {
  patterns: [
    { group: ["**/components/ui/**"], importNames: ["authFetch"], message: "ui components must not touch HTTP" },
    { group: ["../../lib/*", "../../../lib/*"], message: "features talk to lib via their api/ layer" },
  ],
}]
```

…and, more usefully, a ban on the raw primitives until they are gone:

```js
{ group: ["react-hot-toast"], importNames: ["default"], message: "use features/<f>/… toast helpers" }
// plus: no direct `fetch(` outside lib/api.js and features/*/api/*.api.js
```

### 3.4 Styling architecture

> **Implemented already — the flat visual language.** The clay style (gradients, inset shadows, stacked shades) was replaced across the whole app with a flat design built on a **5-token palette** in `src/theme/colors.js` (emitted both as Tailwind utilities and as `:root` vars by `colorVarsPlugin`):
>
> | Token | Role | Typical classes |
> |---|---|---|
> | `canvas` | page background | `bg-canvas` (page containers, modal scrims `bg-canvas/70`) |
> | `surface` | panels, cards, sidebars, modals, inputs | `bg-surface` |
> | `ink` | primary text | `text-ink` |
> | `muted` | subtitles, placeholders, disabled — **and** hairline borders / hover lifts via alpha | `text-muted`, `border-muted/20` (panels), `border-muted/30` (inputs), `hover:bg-muted/10` |
> | `accent` | brand orange: solid buttons, focus, selected state | `bg-accent` + `text-canvas` on top, `focus:ring-2 focus:ring-accent/30` |
>
> Rules that hold app-wide now: **zero shades, zero gradients, zero shadows** (0 in `src` and in the built CSS); radius tops out at `rounded-lg` for cards/panels and `rounded-md` for buttons/inputs, with `rounded-full` reserved for true circles (avatars, spinners, progress tracks); status colors keep Tailwind defaults (`emerald-500`, `red-600`); dark text on accent is `text-canvas`. What remains from this section is *structure*, not color: fonts, shared recipes, and one modal primitive.

1. **Declare fonts once, in Tailwind** — this both kills the 17 copy-pasted `<style>` blocks and fixes the Baloo 2 vs Space Grotesk conflict (F12). The `fontFamily` entries are already in `tailwind.config.js`; what's left is moving the Google `@import` to the top of `src/styles/index.css` and deleting the inline blocks:

```js
// tailwind.config.js
theme: { extend: { fontFamily: {
  display: ["Baloo 2", "sans-serif"],          // default display face
  displayAlt: ["Space Grotesk", "sans-serif"], // quiz maker + results dashboard
  body: ["Inter", "sans-serif"],
}}}
```

The Google `@import` moves to the top of `src/styles/index.css` (one request, no re-injection on every mount). `font-display` / `font-display-alt` become real utilities.

2. **Promote repeated class recipes to `@layer components`** (kills F13):

```css
/* src/styles/components.css */
@layer components {
  .btn-primary {
    @apply px-4 py-2 text-sm bg-accent text-canvas font-display font-bold rounded-md transition-all …;
  }
  .btn-secondary {
    @apply px-4 py-2 text-sm bg-surface text-ink border border-muted/20 rounded-md hover:bg-muted/10 …;
  }
  .input-well {
    @apply bg-surface rounded-md px-3 py-2 text-sm text-ink placeholder:text-muted border border-muted/30 focus:border-accent …;
  }
  .panel {
    @apply bg-surface rounded-lg font-body border border-muted/20;
  }
}
```

Keep using `src/theme/colors.js` tokens inside those recipes — no raw hex and no shades, per current convention (§3.4 note).

3. **One `Modal` primitive** replaces F14 (portal, `Escape`, click-outside, scroll lock, consistent header/footer slots via composition: `<Modal.Header>`, `<Modal.Body>` or props).
4. **Split the two CSS monoliths by feature** when touched: `features/auth/pages/LoginPage.module.css` (or plain CSS files colocated with the page), moving shared card/input recipes into `components.css` first so the leftovers are genuinely page-specific.

### 3.5 Data layer architecture

**API client** (one place for F2 + F3):

```js
// lib/api.js
export class ApiError extends Error { constructor(message, { status, fields } = {}) { … } }

export function createApiClient({ getAccessToken, refresh, onUnauthorized }) {
  return async function apiFetch(path, { method = "GET", body, signal } = {}) {
    const send = (token) => fetch(`${backendHost}${path}`, {
      method,
      signal,
      credentials: "include",                       // always — no call site decides this
      headers: {
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        ...(body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      },
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    });

    let res = await send(await getAccessToken());
    if (res.status === 401) res = await send(await refresh());   // single-flight inside refresh
    if (res.status === 401) { onUnauthorized(); throw new ApiError("Session expired", { status: 401 }); }
    if (!res.ok) throw await toApiError(res);
    return res.status === 204 ? null : res.json();
  };
}
```

- The refresh single-flight logic from `AuthProvider` moves here verbatim; `AuthProvider` keeps only state + effects (fixes F18).
- `backendHost` is read once in `lib/env.js`; `main.jsx` checks `isConfigured` and mounts `ErrorPage` instead of every component re-checking (fixes F3).

**Query keys — a factory, one vocabulary** (fixes F1):

```js
// lib/queryKeys.js
export const quizKeys = {
  all: ["quizzes"],
  list: (params) => [...quizKeys.all, "list", params], // [] = unpaginated, {page} = paged
  detail: (id) => [...quizKeys.all, "detail", id],
  questions: (id) => [...quizKeys.all, id, "questions"], // ONE key for /quizzes/questions
  dashboard: (id) => [...quizKeys.all, id, "dashboard"],
};
export const classKeys = {
  all: ["classes"],
  list: ["classes", "list"],
  detail: (id) => ["classes", "detail", id],
};
export const docKeys = {
  all: ["documents"],
  list: (page) => ["documents", "list", page],
  content: (id) => ["documents", "content", id],
};
export const attemptKeys = { quiz: (token) => ["attempt", token] };
```

**Hooks own the queries** (fixes F4, F5, F6):

```js
// features/quizzes/api/queries.js
export function useQuizzes(params) {
  return useQuery({ queryKey: quizKeys.list(params), queryFn: () => quizApi.list(params) });
}
export function useQuizQuestions(quizId) {
  return useQuery({
    queryKey: quizKeys.questions(quizId),
    queryFn: () => quizApi.questions(quizId),
    enabled: Boolean(quizId),
  });
}

// features/quizzes/api/mutations.js — replaces handleDeleteQuiz & friends
export function useDeleteQuiz() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => quizApi.remove(id),
    onMutate: async (id) => {                       // optimistic
      await qc.cancelQueries({ queryKey: quizKeys.all });
      const snap = qc.getQueriesData({ queryKey: quizKeys.all });
      qc.setQueriesData({ queryKey: quizKeys.all }, (old) => /* filter */);
      return { snap };
    },
    onError: (_e, _id, ctx) => ctx?.snap.forEach(([k, v]) => qc.setQueryData(k, v)),
    onSettled: () => qc.invalidateQueries({ queryKey: quizKeys.all }),  // one invalidation → both list views
  });
}
```

Because `quizKeys.questions(id)` is a single key and `quizKeys.all` is the prefix, **edits made in the quiz maker now invalidate the quizzes page automatically** — that is the whole point of doing F1/F4 together.

**Global QueryClient defaults** (fixes F5):

```js
new QueryClient({
  defaultOptions: {
    queries: { staleTime: 5 * 60_000, refetchOnWindowFocus: false, retry: 1 },
  },
});
```

**Server-error policy**: `queryClient.onError` (or a tiny `useApiError()` helper) → `toast.error(err.message)`; never `alert`, never string-match on error text (fixes F6, F16).

### 3.6 Routing & auth

```jsx
// app/router.jsx
const router = createBrowserRouter([
  { path: "/", element: <RootRedirector /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/error", element: <ErrorPage /> },
  {
    element: <RequireRole role="teacher" />, // one guard, not two
    children: [
      { path: "/teacher", element: <QuizMakerPage /> },
      { path: "/teacher/quizzes", element: <QuizzesPage /> },
      { path: "/teacher/quizzes/:quizId", element: <QuizResultDashboard /> },
      { path: "/teacher/classes", element: <ClassesPage /> },
    ],
  },
  {
    element: <RequireRole role="student" />,
    children: [
      { path: "/student", element: <StudentTokenPage /> },
      { path: "/student/quiz/:quizToken", element: <StudentQuizPage /> },
    ],
  },
]);
```

- `RequireRole` redirects with `state: { from: location }`; `LoginPage` navigates back to `from` after success (fixes F19). Wrong-role access can redirect to the _right_ home instead of `/login`.
- Route-level `errorElement` gives you a real error boundary per route instead of the `!backendHost` checks scattered through render paths.

### 3.7 File & naming conventions

- **One exported component per file**, filename matches the export (`CreateClassModal.jsx`, not inline in `ClassesPage.jsx`).
- Files: `PascalCase.jsx` for components, `camelCase.js` for non-components (`quizApi.js`, `useQuizzes.js`, `queryKeys.js`).
- Components: named `export function Foo()` — drop `export default` + aliasing (`LogInComponent`, `QuizMakerSkeleton`) and fix `SudentTopbar` / `QuizTokenModal` naming when files move.
- Hooks: `useX` in `features/<f>/api/` (server) or `src/hooks/` (generic UI).
- Every network call lives in `features/<f>/api/<f>.api.js`; a component that imports `fetch` or `VITE_BACKEND_HOST` is a bug.

---

## 4. Migration plan

Each phase is independently shippable and leaves `npm run lint` + `npm run build` green. Do not start a phase before the previous one lands.

### Phase 0 — Safety net (no code movement)

- Record a **manual smoke checklist** (9 routes, happy path + one failure path each): login/logout both roles, upload → forge quiz → edit question → results, classes CRUD, student token → answer → submit.
- Baseline: `npm run lint`, `npm run build` at HEAD (frontend has **no tests** — that's why this checklist exists).
- Optional but recommended: add **Vitest + React Testing Library** and cover only 3 flows later touched heavily (quiz submit payload, `apiFetch` error normalization, `RequireRole`). Cheap now, expensive never.

### Phase 1 — Foundations (purely additive)

1. `lib/env.js` + move the `!backendHost` checks out of components; one check in the entry.
2. `lib/api.js` (`apiFetch` + `ApiError`), porting `authFetch`'s refresh logic; `AuthProvider` keeps its public API (`authFetch` re-exported as a shim) so no call site changes yet.
3. Fonts → `tailwind.config.js` `fontFamily` + single `@import` in `index.css`; delete the 17 inline `<style>` blocks (fixes the Baloo 2 / Space Grotesk conflict).
4. Extract `.btn-primary`, `.btn-secondary`, `.input-well`, `.panel`, `.modal-panel` into `styles/components.css`; replace duplicated constants file-by-file.
5. Add `components/ui/`: `Modal`, `Button`, `ConfirmDialog`, `Dropdown`, `Spinner`, `EmptyState`, `ErrorState`, `PanelTabs` + `hooks/useClickOutside`.

_Exit criteria:_ app visually identical, zero `<style>@import` in `src/**/*.jsx`, no duplicated `primaryBtnClass` declarations.

### Phase 2 — Data layer (highest bug payoff)

1. `lib/queryKeys.js` factory; **rename keys so each endpoint has exactly one key** (merges `queryQuestions`/`quizQuestions` and `queryQuizzes`/`userQuizzes`).
2. `lib/queryClient.js` with global defaults; delete per-call `staleTime`/`refetchOnWindowFocus`.
3. Per feature: `api/<f>.api.js` (move service modules + all inline fetchers), `api/queries.js`, `api/mutations.js`.
4. Convert hand-rolled optimistic updates to `useMutation` (`onMutate`/`onError`/`onSettled`).
5. Replace `alert()` and `window.confirm()` with `toast` + `ConfirmDialog`; centralize error → message mapping.

_Exit criteria:_ `grep -r "fetch("` returns only `lib/api.js` and `features/*/api/*.js`; one query key per endpoint; no `alert(`.

### Phase 3 — Structure

1. Create `features/` and move `pages/` + `components/` per §3.2 (mechanical, IDE-aware moves; update imports).
2. Extract route table to `app/router.jsx`, guards to `app/guards/RequireRole.jsx` (with `state.from` redirect), providers to `app/providers/`.
3. Split multi-component files: `CreateClassModal`, `AddStudentModal`, `QuizForgeModal`, `ClassAccessibilityDropdown`, `FileModal`, `SelectQuizModal`, `ClassAccessDropdown`, `NoFileIcon` → one file each.
4. Rename drift while moving (`QuizMakerSkeleton` → `QuizMakerPage`, `SudentTopbar`, `QuizTokenModal`, `toDatetimeLocal`).
5. Split `TopBar` into brand + profile menu + create-quiz action so `QuizMakerPage`'s props (`selectedFile`, `setQuizMetadata`) stop leaking into every page's top bar (today `QuizzesPage` renders `<TopBar />` with both props undefined).

_Exit criteria:_ no file over ~300 lines except intentionally complex ones; `components/ui` imports nothing from `features/`.

### Phase 4 — UX consistency pass

- One responsive shell: replace the 4 duplicated `mobileTab` switchers with `<AppShell panels={[…]}>` / `PanelTabs`.
- Uniform loading/empty/error states (`Spinner`, `EmptyState`, `ErrorState`) — today each modal invents its own overlay.
- Move quiz-attempt `sessionStorage` access into `features/student-quiz/lib/attemptStorage.js` (typed helpers: `loadAnswers`, `saveProgress`, `clearAttempt`).

### Phase 5 — Cleanup / optional

- Split `Login.css` (1,639) and `StudentTokenPage.css` (748) into colocated, component-scoped sheets.
- Prune unused assets (several `*_clean/*_crop/*_perfect` variants of the same image).
- Consider `React.lazy` for the heavier routes (chart.js is only needed on the results dashboard).

---

## 5. Explicit non-goals

- **No TypeScript migration in this refactor.** The app is plain JS/JSX by choice (no typecheck script exists). Mixing a TS conversion with a structural refactor doubles review surface; revisit afterwards, feature by feature.
- **No Redux / Zustand / context-per-feature sprawl.** Server state is React Query's job; the only global client state is auth.
- **No router rewrite** (keep `react-router-dom`), no CSS-framework change, no component-library dependency (`shadcn`/MUI) — the app has a custom design system already; we're just giving it one implementation.
- **No behavior changes** in Phases 1–3. If a phase needs a behavior change to land, split it into its own PR.

---

## 6. Suggested PR slicing

| PR   | Contents                                                                           | Risk                          |
| ---- | ---------------------------------------------------------------------------------- | ----------------------------- |
| 1    | Phase 0 checklist + Vitest scaffold                                                | none                          |
| 2    | Fonts + `@layer components` style recipes (Phase 1.3–1.4)                          | low, visual review            |
| 3    | `lib/env.js` + `lib/api.js` + `AuthProvider` slimming (Phase 1.1–1.2)              | medium, auth paths            |
| 4    | `components/ui` primitives + swap modals/dropdowns (Phase 1.5)                     | low–medium                    |
| 5    | Query key factory + key unification (Phase 2.1–2.2)                                | **high payoff**, medium risk  |
| 6+   | Per-feature `api/queries/mutations` extraction (Phase 2.3–2.4), one PR per feature | low each                      |
| n    | `features/` folder moves (Phase 3), one feature per PR                             | low, conflicts are mechanical |
| last | Shell/`PanelTabs`, alert cleanup, CSS split (Phase 4–5)                            | low                           |

**Rule of thumb:** never combine a folder move and a logic change in the same PR — git history and review both stay useful that way.
