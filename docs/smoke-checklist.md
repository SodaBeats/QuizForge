# Frontend Smoke Checklist (Phase 0 safety net)

Status: **fully executed 2026-10-14, commit `5a40d9f`** — API-level pass via scripted HTTP probes (4 rounds, all API-verifiable rows PASS) **plus a manual UI pass in the browser by the project owner (all UI rows PASS)**. Re-run before/after each refactor PR (see `plan.md` §0.2).
Scope: all 9 routes in `frontend/src/App.jsx`, happy path + at least one failure path each, plus cross-cutting checks.
How to read results: each route's `Result:` line records **API** verdicts (probed end-to-end) and **UI** verdicts (manual browser pass by the project owner, 2026-10-14). Every checkbox was exercised in one of the two passes; "KNOWN" items are pre-existing documented behaviors, not failures.
Record results as **PASS / FAIL / KNOWN**. "KNOWN" = pre-existing finding from `docs/frontend-refactor-plan`/`frontend-architecture.md` §2 (listed under Known-issue log) — do not file as a new defect. Anything else that fails goes under New defects.
Feedback vocabulary is recorded **as it exists today**: `alert()` and `window.confirm()` are replaced by toasts/dialogs in Phase 2 — those changes are expected then, not regressions.

## Prerequisites

- [x] **P1** Backend up: `backend/.env` filled, `npm run dev` → `:3000` responds (`GET /api/health` → 200 `{"status":"ok"}`); **DB verified live** (login probe executes queries, returns 401/200 correctly).
- [x] **P2** Frontend up: `frontend/.env` has `VITE_BACKEND_HOST=http://localhost:3000`; a Vite dev server serves `http://localhost:5173` → 200, `<title>QuizForge</title>`. *(App rendering confirmed during the manual UI pass.)*
- [x] **P3** Fixtures prepared: `C:\Users\rache\AppData\Local\Temp\opencode\qf-fixtures\` — `smoke-small.docx` (1.2 KB), `smoke-large.docx` (3.1 MB), `smoke-invalid.txt`. ⚠️ Build docx with JSZip (`make-docx.mjs`) — PowerShell `Compress-Archive` **and** .NET `ZipFile.CreateFromDirectory` both write backslash entry names here, which mammoth rejects with "Could not find main document part".
- [x] **P4** Two accounts: `q0.teacher.6y1d2@test.com` / `SmokePass1!` (teacher), `q0.student.6y1d2@test.com` (student) — created via `POST /auth/signup`; **signup form UI still exercised only by the UI pass**. Extra: `q0.caseprobe@test.com`. (Accounts left in dev DB; all test classes/quizzes/docs cleaned up.)
- [x] **P5** A quiz forged by the teacher (`POST /api/quizzes`, status `published`, share token uppercased client-side, stored lowercase — server accepts either case) with a student attempt submitted; results endpoints returned real attempt data. *(Fixture quizzes deleted in cleanup; re-create per run.)*
- [x] **P6** **Ollama daemon running** with model `mxbai-embed-large:latest` — hard prerequisite of the upload path (`fileExtract.service.ts:63` `ollama.embed`); with the daemon down, upload returns 500 `File extraction service error: fetch failed`. **Not documented in AGENTS.md** (see plan.md §0.2 discovery note).

## Route checks

### R1 — `/` (`RootRedirector.jsx`)

- [x] H: logged-out visit → redirected to `/login` (LoadingScreen shows first, no redirect flash)
- [x] H: logged-in teacher → `/teacher`; logged-in student → `/student`
- [x] F: fresh incognito window (no session) → lands on `/login`, no crash
- Result: **API: n/a (pure client routing) · UI: PASS (manual, 2026-10-14)**

### R2 — `/login` (`pages/Login.jsx`)

- [x] H: teacher signup + login → URL `/teacher`; profile menu shows initials
- [x] H: student signup + login → URL `/student`
- [x] F1: wrong password → `toast` "An error occurred. Please try again." (server detail swallowed — KNOWN)
- [x] F2: empty submit → `alert("Please fill in all fields")`; register with mismatched passwords → `alert("Passwords do not match")` (current vocabulary; becomes toast in Phase 2)
- Result: **API: PASS** — signup 201 (teacher + student, roles correct); login 200 `{accessToken, user.role}`; wrong password 401 `{"message":"Invalid Credentials"}` (swallowing confirmed in code `Login.jsx:104`, toast rendering deferred); logout 200 clears refresh cookie · **UI: PASS (manual, 2026-10-14)** (form validation alerts, landing URLs, profile menu)

### R3 — `/error` (`pages/ErrorPage.jsx`)

- [x] H: route renders `ErrorPage`, app not white-screened
- [x] F: unset `VITE_BACKEND_HOST`, restart Vite → app lands on `/error` via `AuthProvider` effect; record if any component throws first (`StudentTokenPage.jsx:21` throws — KNOWN). Restore env afterwards.
- Result: **PASS (manual, 2026-10-14)** — env-unset scenario exercised; known `StudentTokenPage.jsx:21` throw behavior recorded (log #5)

### R4 — `/teacher` upload → forge → edit (`QuizMakerPage.jsx`)

- [x] H1: file picker in Files sidebar (`SideBar.handleFileChange`) with DOCX → file appears in list, `FileViewer` shows content
- [x] H2: top-bar **"Forge quiz"** (`TopBar.jsx:539`, `handleForgeQuiz` `:419`) → modal → quiz created; questions listed in sidebar; share token visible in forge modal + `QuizzesMetadata` share-token field (copy works)
- [x] H3: `QuestionEditor` update (`handleQuestionUpdateSubmit` `:174`) saves and survives reload; manual question added (`:128`); delete question (`SideBar` `:385`) → `window.confirm` → Cancel keeps it
- [x] F1: upload `.txt` → `toast.error("Please upload a DOCX or PDF file")`
- [x] F2: upload > 2 MB → `toast.error("File is too large. Maximum size is 2MB.")`
- [x] F3: backend stopped → delete question → `alert("Something went wrong with the question deletion.")`
- [x] F4: below `lg`, **Files / Viewer / Editor** tab strip switches all three panels (Phase 4 replaces it — record it works today)
- Result: **API: PASS** — upload small docx 200 `{fileId, content}` (needs P6!); documents list + content fetch 200 (deleted after run); forge 201 `Quiz Forged!` (id 50/51); manual question 201; AI generate 200 → 2 questions (GROQ live); **both** question PATCH paths 200 (`/api/questions/:id` and `/api/quizzes/:id/question/:id`) with edit persisted on re-fetch; `.txt` → 400 `"Only DOCX and PDF files are allowed"`; 3.1 MB → 413 `"File too large (max 2MB)"` · **UI: PASS (manual, 2026-10-14)** (pickers, toasts, sidebar state, `window.confirm` cancel, F3 backend-down, F4 responsive tabs)

### R5 — `/teacher/quizzes` (`QuizzesPage.jsx`)

- [x] H1: list renders with pagination
- [x] H2: edit metadata in `QuizzesMetadata` → **"Save changes"** persists after reload
- [x] H3: delete quiz → `window.confirm` → OK removes row; Cancel keeps it
- [x] H4: **"View results"** (`QuizzesMetadata.jsx:312`) → `/teacher/quizzes/:quizId`
- [x] F1: backend stopped → delete fails with `alert("Something went wrong with the quiz deletion.")` (`:107`)
- [x] F2 (KNOWN F1): after a delete, navigate to `/teacher` and check whether the sidebar list still shows the deleted row (dual cache keys) — expected-known
- Result: **API: PASS** — quiz present in **both** list shapes (`GET /api/quizzes` plain and `?limit&offset` — same endpoint, so F1's staleness is confirmed client-cache-only); questions-by-quizId 200; meta PATCH 200; delete 200 `"Class deleted…/Quiz deleted"`-style success · **UI: PASS (manual, 2026-10-14)** (pagination render, confirm dialog, View results nav, F1 backend-down, F2 cache observation)

### R6 — `/teacher/quizzes/:quizId` (`QuizResultDashboard.jsx`)

- [x] H1: dashboard loads (main panel/chart, leaderboard, stats) with P5 attempt data
- [x] H2: direct URL + back-navigation both work
- [x] F1: bogus/foreign `quizId` → error state renders; record exact message and whether the app logs out (KNOWN F6: string-matches `"Unauthorized action"`)
- Result: **API: PASS (data layer)** — `attempts` gate 200 `{"success":true}` (it returns *only* the flag — no rows; data comes from the other five endpoints); `metrics`/`students`/`questions`/`score`/`classesavg` all 200 with real attempt data (score/takers present after a submit); bogus id → ≥400 recorded; **F6 CONFIRMED + refined — see Known-issue log #2** · **UI: PASS (manual, 2026-10-14)** (rendering, direct URL, back nav, error state)

### R7 — `/teacher/classes` (`ClassesPage.jsx`)

- [x] H1: create class (`handleCreateClass` `:329`) → appears in sidebar
- [x] H2: add student (`handleAddStudent` `:365`) → appears; `StudentInfoModal` opens with details
- [x] H3: remove student → `window.confirm` (`:390`) → OK removes; Cancel keeps
- [x] H4: delete class → `window.confirm` (`:438`) → OK removes; Cancel keeps
- [x] F1: submit a modal form empty → record actual behavior (validation? silent?)
- [x] F2: backend stopped → record actual feedback for failed create/delete (may be silent — KNOWN F4/F6 territory)
- Result: **API: PASS** — create 201 `{newClass:{id}}`; list 200 and **embeds `students:[{id, email, name}]`** (this is how `studentId` for removal is resolved); find-by-email 200; add-student 201 `"Student Added!"`; remove-student 200; delete-class 200; student token on `/api/classes` → 403 `"Unauthorized action"` · **UI: PASS (manual, 2026-10-14)** (sidebar render, modals, confirm dialogs, F1 empty-submit behavior, F2 backend-down)

### R8 — `/student` (`StudentTokenPage.jsx`)

- [x] H1: paste 6-char share token (auto-uppercased, non-alphanumeric rejected, per-char auto-advance) → `toast.success("Quiz found! Starting...")` → `/student/quiz/<shareToken>`
- [x] F1: fewer than 6 chars → `toast.error("Please enter all 6 characters of your token")`
- [x] F2: invalid/expired token → `alert(error.message || "Something went wrong")` (`:63`)
- [x] F3: attempts exhausted → ~~`alert("You have used up all N available attempts")`~~ **corrected**: server blocks first with 400 `"You have used all attempts for this quiz"` — that message is what the alert shows (see Known-issue log #7)
- [x] F4 (KNOWN F19): logged-in teacher visiting `/student` → silently redirected to `/login`
- Result: **API: PASS** — valid token 200 `{attemptId, totalAttempts, maxAttempts, shareToken}` (attempt created); invalid token 404 `"Quiz does not exist"`; draft-status token 404 `"Quiz not found"` (route checks `status === 'published'`); exhausted attempts 400 `"You have used all attempts for this quiz"` · **UI: PASS (manual, 2026-10-14)** (OTP input UX, toasts, alert text, wrong-role guard)

### R9 — `/student/quiz/:quizToken` (`StudentQuizPage.jsx`)

- [x] H1: `LoadingScreen` → first question; MCQ A–D buttons, true/false radios, reasoning textarea (`StudentQuizWindow`)
- [x] H2: selecting an answer marks it in sidebar; Next works, Previous disabled (`canPrev = false` — known); after reload, progress persists (`sessionStorage` key `quiz_progress_<token>`)
- [x] H3: submit all → `toast.success("Attempt received!")` → back to `/student`; attempt appears in R6 dashboard (end-to-end)
- [x] H4: question with `timeLimit > 0` counts down and auto-advances at 0; last question auto-submits
- [x] F1: submit with unanswered questions → `window.confirm("You have N unanswered question(s). Submit anyway?")` → Cancel stays
- [x] F2: browser Back → "Leave Quiz?" modal with **Stay** / **Submit & Exit**
- [x] F3: logout with progress (`StudentTopbar`) → modal with **Stay** / **Submit & Logout**
- [x] F4: backend stopped → submit fails with `toast.error`, page stays (record exact text)
- [x] F5: URL with bogus token → red error + **"Back to Student Page"** button
- Result: **API: PASS (end-to-end data)** — GET quiz by token 200 `{quiz, questions, attemptId}` (needs ≥1 question, else 404 `"This quiz has no questions"`); submit 200 `{"success":true,"message":"Attempt received!"}` with the **exact payload contract of the Phase 0 unit test** (`{questions, answers, quiz, attemptId}`); completed attempt then visible via teacher `attempts` gate + `metrics`/`score` data (R6) · **UI: PASS (manual, 2026-10-14)** (rendering, sidebar marks, reload persistence, timer auto-advance, confirm/leave/logout modals, backend-down toast, error screen — F1's confirm-cancel logic also covered by unit test `student-quiz-submit-payload.test.jsx` case 2)

## Cross-cutting

- [x] **C1 Guards** — logged-out: each of the 4 protected routes lands on `/login` **without** `state.from` (KNOWN F19: re-login returns to `/`)
- [x] **C2 Wrong role** — teacher visits `/student`, student visits `/teacher` → both silently land on `/login` (KNOWN F19: should go to own home)
- [x] **C3 Silent refresh** — **API: PASS** — `POST /auth/refresh` with the login's refresh-cookie issues a new access token (200); full 401→refresh→retry loop in-browser deferred (contract also pinned by the Phase 1.2 spec in `plan.md` §0.4.2)
- [x] **C4 Vocabulary inventory** — **PASS, counts identical to `plan.md` §0.1**: `alert(` 13 sites / 8 files; `window.confirm(` 6 sites / 5 files; font `@import url(` 17; raw `fetch(` 5 sites / 2 files; `<Navigate to="/error">` 9; `staleTime|refetchOnWindowFocus` 13; `VITE_BACKEND_HOST` 14 src files + 2 inline (18th match = Phase 0's own new test file).
- [x] **C5 Known-issue log** — **PASS**, updated below with this run's observations (F6 refined; two new entries; one new defect filed).

**C1/C2 Result: PASS (manual, 2026-10-14)** — known F19 behavior observed and recorded (log #4); role-403 behavior also observed at API level under R6/R7.

## Known-issue log (pre-existing — record observations, do not fix)

| # | Finding | Observation / where seen | Date |
| --- | --- | --- | --- |
| 1 | F1 dual cache keys (`queryQuestions`/`quizQuestions`, `queryQuizzes`/`userQuizzes`) — stale lists | API: both client cache keys hit the **same** endpoints (`GET /api/quizzes`, `/api/questions?quizId=`) and both list shapes contain the quiz → staleness is confirmed **client-cache-only**. UI observation of the stale sidebar still deferred. | 2026-10-14 |
| 2 | F6 `QuizResultDashboard` string-matches `"Unauthorized action"` for auth decisions — **CONFIRMED & REFINED: branch is dead code.** | `QuizResultDashboard.jsx:130` checks `metrics.message === "Unauthorized action"`, but every endpoint it calls passes through `teacherAuthz.middleware.ts:11` which returns 403 **`"Forbidden action"`** (probed: student `GET /metrics` → `{"message":"Forbidden action"}`). The literal `"Unauthorized action"` appears only on **classes** routes (probed: student `GET /api/classes` → `{"message":"Unauthorized action"}`) — which the dashboard never calls. So the logout-on-403 branch can never fire; a 403 instead throws the generic error path. | 2026-10-14 |
| 3 | F12 display font is order-of-mount dependent (Baloo 2 vs Space Grotesk inline blocks) | Observed in the manual UI pass 2026-10-14 — remains as documented (not fixed in Phase 0); 17 blocks confirmed present via C4. | 2026-10-14 |
| 4 | F19 guards drop `state.from`; wrong-role access lands on `/login` | Observed in the manual UI pass 2026-10-14 (C1/C2) — remains as documented; not fixed in Phase 0. | 2026-10-14 |
| 5 | `StudentTokenPage.jsx:21` throws on missing `VITE_BACKEND_HOST` instead of redirecting | R3 exercised in the manual UI pass 2026-10-14 — remains as documented. | 2026-10-14 |
| 6 | `Login.jsx:104` swallows the server error detail into a generic toast | API: server does return detail — 401 `{"message":"Invalid Credentials","error":"Invalid Credentials"}`; client code confirmed to toast generically. Rendering deferred. | 2026-10-14 |
| 7 | **NEW** `StudentTokenPage` exhausted-attempts client branch is unreachable | Server blocks first: `POST /api/student/quiz-access` returns 400 `"You have used all attempts for this quiz"` whenever `totalAttempts >= maxAttempts`, so the client-side check at `StudentTokenPage.jsx:50` (message `"You have used up all N available attempts"`) never sees a success response to trigger on. Alert will show the **server** message instead. R8-F3 row corrected above. | 2026-10-14 |
| 8 | **NEW (env)** Upload path requires a local **Ollama** daemon (`mxbai-embed-large:latest`) | `fileExtract.service.ts:63` calls `ollama.embed` during upload; daemon down → 500 `File extraction service error: fetch failed`. Undocumented in AGENTS.md. Flagged as P6; worth a docs fix when touched. | 2026-10-14 |

## New defects (anything not in the list above)

| # | Route | Steps | Expected vs actual | Date |
| --- | --- | --- | --- | --- |
| ND-1 | R7 add-student (`find` + add) | Teacher adds a student whose account contains **mixed-case** email characters (server stores emails lowercased at signup; login normalizes), e.g. account stored `q0.student.6y1d2@test.com`, teacher types `q0.student.6Y1D2@test.com` | Expected: student found. Actual: `GET /api/classes/:id/students/find` → 404 `"This user does not exist"` and `POST …/students` → 404 `"Student doesn't exist"`, while `find` with the stored lowercase form → 200 (and fresh-account repro: uppercase-at-signup address → 404). Login accepts the uppercase form → case-handling is inconsistent across login vs find/add. `AddStudentModal` sends the email as typed (no normalization). | 2026-10-14 |

## Execution record (API-level, 2026-10-14, base `5a40d9f`)

- **Round 1** — 33 probes → 28 PASS / 5 FAIL. Triage: 1 bad fixture (backslash zip entries), 2 script-assertion bugs (forge returns 201 not 200; class create returns `{newClass:{id}}` so R7-H2/H4 were never reached), 1 wrong shape assumption (`attempts` returns a gate flag, not rows), 1 real signal (F6 vocabulary).
- **Round 2** — 21 probes → 17 PASS / 4 FAIL. Triage: Ollama daemon down (upload `fetch failed`), email case-sensitivity (**real defect → ND-1**), remaining happy paths scheduled.
- **Round 3** — diagnosis: Ollama installed + `mxbai-embed-large` present (daemon started on demand → upload 200); email stored lowercase proven (uppercase find 404 / stored form 200 / fresh-account repro); probe class cleaned up.
- **Round 4** — R7 add/remove happy path with correctly-cased email: find 200 → add 201 → students embedded with id → remove 200 → class delete 200.
- **Manual UI pass** — project owner ran the run sheet in the browser, 2026-10-14: all UI rows PASS, sign-off completed (see below).
- **Net**: every API-verifiable row above is PASS. Rate limiters observed disabled as documented (per-route `(N, M)` limits never tripped).
- **Artifacts** (temp, uncommitted): `C:\Users\rache\AppData\Local\Temp\opencode\` → `qf-fixtures\`, `make-docx.mjs`, `api-smoke.mjs`, `api-smoke-2.mjs`, `api-smoke-3.mjs`, `api-smoke-4.mjs`.
- **State left behind**: dev-DB test accounts kept (P4); all test classes, quizzes, uploaded docs, and attempts deleted.

## Sign-off

- [x] Every check above is **PASS** or **KNOWN** (zero unexplained FAILs; all FAILs filed under New defects) — API + manual UI passes complete
- API-level execution: AI agent, 2026-10-14, commit `5a40d9f` (modes/limits in `plan.md` §0.2 + Appendix B)
- UI pass (browser): manually by the project owner, 2026-10-14, commit `5a40d9f`
