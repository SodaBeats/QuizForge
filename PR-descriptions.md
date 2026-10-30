# Frontend refactor — PR descriptions

Roadmap: `docs/frontend-refactor-plan.md`. Phase 0 (safety net: Vitest + smoke checklist) shipped as PR #27, merged 2026-10-15. Phase 1 (foundations) is the three PRs below — all on branch `refactor/phase-1-foundations`, all visually identical, all lint/build/test green.

---

## PR 2 — Fonts declared once + shared button/input classes (Phase 1.3 + 1.4)

Commit: `fe82d9f` · Visual pass: ✅ approved

**What changed**
- All Google Fonts now load from one `@import` in `src/index.css`. The 17 copy-pasted `<style>` blocks (spread over 15 JSX files) are gone.
- `tailwind.config.js` gained a `displayAlt` (Space Grotesk) font token; the QuizMaker and QuizResultDashboard headings use it explicitly, ending the "which display font wins depends on load order" flicker.
- New `src/styles/components.css` with shared recipes — `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.input-well`, `.modal-panel`. These replace four class constants that were duplicated (and had drifted apart) across six files; ~35 call sites now use the recipe plus their own small deltas. Every button/input looks exactly like before.
- The thin themed scrollbars moved into CSS. They used to live in inline `<style>` blocks, so they only existed while their component happened to be on screen — now they always apply.

**Why**
One owner per style kills the drift between copies, fixes the display-font conflict, and makes the styling deterministic. This was pure extraction: no visual or behavioral change.

---

## PR 3 — One env read + one API client (Phase 1.1 + 1.2)

Commit: `9311418`

**What changed**
- New `src/lib/env.js` is the only file that reads `VITE_BACKEND_HOST`. The app checks it once at startup and shows the ErrorPage if it's missing. Previously 14 files each read the variable themselves, 9 of them redirected to `/error` on their own, and one page hard-crashed.
- New `src/lib/api.js` centralizes the fetch wrapper: adds the auth header, refreshes the session once on a 401 and retries the request, and always sends cookies (`credentials: "include"`). `AuthProvider` builds one client and keeps exposing it as `authFetch`, so no calling code changed.
- New helpers for the repeated "parse the error JSON" boilerplate (`ApiError`, `getApiErrorMessage`, `parseApiBody`) — call sites adopt them during Phase 2.
- New tests: the API client (refresh/retry, expired session, headers) and the startup env check. Suite: 13/13 at the time.

**Why**
Auth and env bugs had 14 possible hiding places and duplicated code that had already drifted (some requests forgot to send cookies). Now there's one place to fix each. The delayed Phase 0 test for the API client landed here, as planned.

---

## PR 4 — UI primitives: `components/ui/` + `useClickOutside` (Phase 1.5)

**What changed**
- New `src/hooks/useClickOutside.js`: one shared version of the "close the menu when clicking elsewhere" listener that was hand-written 5 times.
- New `src/components/ui/`:
  - `Modal` — renders through a portal and owns the interaction rules: Escape closes, clicking the backdrop closes, Tab stays inside, focus moves in and is restored on close, and the page behind doesn't scroll.
  - `Dropdown` — owns the open/close state and click-outside close; call sites keep their exact trigger and menu markup.
  - `Button`, `ConfirmDialog`, `Spinner`, `EmptyState`, `ErrorState`, `PanelTabs` — ship as tested building blocks only; pages adopt them in Phase 2.5/4 so each file is touched exactly once.
- Swapped in now (visually identical): 4 hand-rolled menus → `Dropdown` (the two profile menus, the two class-access dropdowns) and 10 hand-rolled overlay divs → `Modal` (document/quiz pickers in the sidebar, forge-quiz modal, create-class and add-student modals, student-info popup).
- One deliberate behavior addition, per the plan: modals close on Escape, and on backdrop click — except the three form modals, where backdrop click stays inert so it can't discard typed input or interrupt a submit.
- New tests: Modal (Escape, click-outside, scroll lock), Dropdown (open/close), ConfirmDialog (confirm/cancel). Suite: 29/29.

**Why**
Menus and modals were the last big copy-paste pile: every overlay re-implemented its own backdrop, close logic, and positioning. Future phases (confirm dialogs, page-level cleanups) now plug into one tested primitive instead of copying another overlay.

---

## Phase 1 verification (all green, 2026-10-23)

- `npm run lint` → 0 problems · `npm run build` → passes (only the known chunk-size warning) · `npm test` → 29/29.
- Backend-origin reads: exactly 1 (`lib/env.js`). Inline font imports in components: 0. Old duplicated class constants: 0.
- `alert(` (13) and real `window.confirm(` (6) untouched on purpose — replacing those is Phase 2's job.

## PR 5 — Data layer (Phase 2)

**Summary**
Move frontend server state and request handling into a shared React Query data layer.

**Changes**
- Add shared query keys and QueryClient defaults; consolidate query invalidation.
- Add feature API, query, and mutation modules; remove obsolete service modules and inline fetchers.
- Convert write handlers to `useMutation` and replace alerts/confirms with toast and `ConfirmDialog`.

**Notes**
- Phase 2 exit criteria are met. Lint and build pass; all 37 tests pass (the build reports the existing chunk-size warning).
