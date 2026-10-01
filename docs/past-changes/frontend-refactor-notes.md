# AGENTS.md

## Frontend (`frontend/`)

React 19 + Vite 7 SPA. Styling with Tailwind CSS 3 (global `src/index.css`, a few page-local `.css` files). Routing via `react-router-dom` 7, server state via `@tanstack/react-query` 5, toasts via `react-hot-toast`, charts via `chart.js` / `react-chartjs-2`.

### Scripts

| Command           | Purpose                               |
| ----------------- | ------------------------------------- |
| `npm run dev`     | Start Vite dev server                 |
| `npm run build`   | Production build (outputs to `dist/`) |
| `npm run lint`    | ESLint (`eslint .`)                   |
| `npm run preview` | Preview the production build          |

Config: `vite.config.js` (plain, only the React plugin), `tailwind.config.js`, `postcss.config.js`, `eslint.config.js`, `.prettierrc`. Backend origin comes from `.env` (`VITE_BACKEND_HOST`, see `.env.example`).

### File structure

```
frontend/
├── index.html                 # Vite entry HTML
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── eslint.config.js
├── .prettierrc
├── .env / .env.example        # VITE_BACKEND_HOST
├── dist/                      # Build output (generated, ignore)
└── src/
    ├── main.jsx               # Entry: BrowserRouter > AuthProvider > QueryClientProvider > App
    ├── App.jsx                # Route table + ProtectedRoute / StudentRoute guards
    ├── index.css              # Global styles (Tailwind entry)
    ├── reference.jsx          # ⚠ Legacy reference copy (see Notes)
    ├── assets/                # Static images (avatars, checklist/books/lightbulb/paper_plane
    │                          #  variants: base/_clean/_crop/_perfect/_token, backgrounds)
    ├── pages/                 # One component per route
    │   ├── Login.jsx / Login.css
    │   ├── ErrorPage.jsx
    │   ├── ClassesPage.jsx
    │   ├── QuizzesPage.jsx
    │   ├── QuizMakerPage.jsx
    │   ├── QuizResultDashboard.jsx
    │   ├── StudentTokenPage.jsx / StudentTokenPage.css
    │   └── StudentQuizPage.jsx
    ├── components/            # Flat component directory (no subfolders yet)
    │   ├── AuthProvider.jsx    # AuthContext: token + userInfo, used by guards and most components
    │   ├── RootRedirector.jsx  # "/" → role-based redirect
    │   ├── LoadingScreen.jsx / LoadingScreen.css
    │   ├── TopBar.jsx          # Teacher top bar (uses classServices)
    │   ├── SideBar.jsx         # Teacher sidebar (uses documentServices)
    │   ├── FileViewer.jsx
    │   ├── QuestionEditor.jsx
    │   ├── QuizzesSideBar.jsx
    │   ├── QuizzesMetadata.jsx
    │   ├── QuizzesQuestionList.jsx
    │   ├── ResultsMainPanel.jsx
    │   ├── ResultsLeaderboard.jsx
    │   ├── ClassesSidebar.jsx
    │   ├── StudentInfoModal.jsx
    │   ├── StudentTopbar.jsx
    │   ├── StudentSidebar.jsx
    │   ├── StudentQuizWindow.jsx
    │   ├── StudentTimeLimit.jsx
    │   └── StudentTokenInput.jsx
    ├── services/              # API layer (fetch wrappers, exported singletons)
    │   ├── documentServices.js   # documentServices
    │   ├── classServices.js      # classServices
    │   └── studentQuizService.js # studentQuizService
    └── util/
        ├── getInitials.js        # getInitials(name)
        └── toDateTimeLocal.js    # toDatetimeLocal(dateString)
```

### Routes (`src/App.jsx`)

| Path                       | Page                  | Guard                      |
| -------------------------- | --------------------- | -------------------------- |
| `/`                        | `RootRedirector`      | —                          |
| `/login`                   | `Login`               | —                          |
| `/error`                   | `ErrorPage`           | —                          |
| `/teacher`                 | `QuizMakerPage`       | `ProtectedRoute` (teacher) |
| `/teacher/quizzes`         | `QuizzesPage`         | `ProtectedRoute` (teacher) |
| `/teacher/quizzes/:quizId` | `QuizResultDashboard` | `ProtectedRoute` (teacher) |
| `/teacher/classes`         | `ClassesPage`         | `ProtectedRoute` (teacher) |
| `/student`                 | `StudentTokenPage`    | `StudentRoute` (student)   |
| `/student/quiz/:quizToken` | `StudentQuizPage`     | `StudentRoute` (student)   |

Both guards live inline in `App.jsx` and read `AuthContext` (`token`, `userInfo.role`), redirecting to `/login` on failure.

### Component → consumer map

- `AuthProvider` — consumed by nearly every page/component (auth state), plus `main.jsx` and `App.jsx`.
- `LoadingScreen` — `AuthProvider`, `FileViewer`, `RootRedirector`, `StudentQuizPage`.
- Teacher quiz maker (`QuizMakerPage`) — `TopBar`, `SideBar`, `FileViewer`, `QuestionEditor`.
- Teacher quizzes (`QuizzesPage`) — `TopBar`, `QuizzesSideBar`, `QuizzesMetadata`, `QuizzesQuestionList`.
- Teacher results (`QuizResultDashboard`) — `TopBar`, `ResultsMainPanel`, `ResultsLeaderboard`.
- Classes (`ClassesPage`) — `TopBar`, `ClassesSidebar`, `StudentInfoModal`.
- Student quiz (`StudentQuizPage`) — `StudentTopbar`, `StudentSidebar`, `StudentQuizWindow`, `StudentTimeLimit`, `LoadingScreen`.
- Student token (`StudentTokenPage`) — `AuthProvider` + asset images.

### Notes for refactoring

- `components/` is flat and mixes teacher UI, student UI, shared shell (`TopBar`, `SideBar`, `LoadingScreen`), and infrastructure (`AuthProvider`, `RootRedirector`) — a natural split candidate (e.g. `components/teacher/`, `components/student/`, `components/shared/`, `context/`).
- `src/reference.jsx` is a stale legacy copy of the quiz maker: it imports non-existent `./components/layout/*` paths and hardcodes a PHP upload endpoint. Nothing imports it; safe to delete or keep as reference.
- Services are plain fetch wrappers returning singletons; React Query is set up in `main.jsx` but the service layer itself does not use query hooks.
- CSS is mostly Tailwind utility classes; `Login.css`, `StudentTokenPage.css`, and `LoadingScreen.css` are the only component/page stylesheets.
