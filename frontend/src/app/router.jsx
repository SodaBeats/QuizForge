import { lazy, Suspense } from "react";
import { Routes, Route, Outlet } from "react-router-dom";
import { QuizMakerPage } from "../features/quizzes/pages/QuizMakerPage";
import { DashboardPage } from "../features/dashboard/pages/DashboardPage";
import { LoginPage } from "../features/auth/pages/LoginPage";
import { QuizzesPage } from "../features/quizzes/pages/QuizzesPage";
import { StudentTokenPage } from "../features/student-quiz/pages/StudentTokenPage";
import { StudentQuizPage } from "../features/student-quiz/pages/StudentQuizPage";
import { ClassesPage } from "../features/classes/pages/ClassesPage";
import { ExamAttemptsPage } from "../features/exam-attempts/pages/ExamAttemptsPage";
import { Spinner } from "../components/ui/Spinner";
import { ErrorPage } from "./ErrorPage";
import { RouteError } from "./RouteError";
import { RootRedirector } from "./guards/RootRedirector";
import { RequireRole } from "./guards/RequireRole";

// Phase 5.2: the results dashboard is the only chart.js consumer — lazy-load
// it so chart.js stays out of the initial bundle. The page has a named export,
// so map it to `default` for React.lazy.
const QuizResultDashboard = lazy(() =>
  import("../features/quizzes/pages/QuizResultDashboard").then((m) => ({
    default: m.QuizResultDashboard,
  })),
);

// Route table (Phase 3 step 2, behavior pass in step 3): the guards are one
// RequireRole keyed by role — logged out → /login with state.from, wrong
// role → that role's home. The parent layout route attaches a single
// errorElement for the whole tree.
export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Outlet />} errorElement={<RouteError />}>
        <Route path="/" element={<RootRedirector />} />

        {/* Teacher home is the dashboard. The exam workstation (the former
            /teacher) moved to /teacher/exam-workstation — ForgeQuizAction's
            pathname checks and QuizzesSideBar's forge-modal navigations key
            off that path. */}
        <Route
          path="/teacher"
          element={
            <RequireRole role="teacher">
              <DashboardPage />
            </RequireRole>
          }
        />
        <Route
          path="/teacher/exam-workstation"
          element={
            <RequireRole role="teacher">
              <QuizMakerPage />
            </RequireRole>
          }
        />
        <Route
          path="/teacher/quizzes"
          element={
            <RequireRole role="teacher">
              <QuizzesPage />
            </RequireRole>
          }
        />
        <Route
          path="/teacher/quizzes/:quizId"
          element={
            <RequireRole role="teacher">
              {/* Matches the dashboard's own h-screen bg-canvas root */}
              <Suspense
                fallback={
                  <div className="flex h-screen items-center justify-center bg-canvas">
                    <Spinner />
                  </div>
                }
              >
                <QuizResultDashboard />
              </Suspense>
            </RequireRole>
          }
        />
        {/* Exam attempts for one quiz — exam + list come from the API (the
            detail modal still runs off the mock generator until its phase).
            Ranked above the bare :quizId route by specificity regardless of
            order. */}
        <Route
          path="/teacher/quizzes/:quizId/attempts"
          element={
            <RequireRole role="teacher">
              <ExamAttemptsPage />
            </RequireRole>
          }
        />
        <Route
          path="/teacher/classes"
          element={
            <RequireRole role="teacher">
              <ClassesPage />
            </RequireRole>
          }
        />
        <Route
          path="/student"
          element={
            <RequireRole role="student">
              <StudentTokenPage />
            </RequireRole>
          }
        />
        <Route
          path="/student/quiz/:quizToken"
          element={
            <RequireRole role="student">
              <StudentQuizPage />
            </RequireRole>
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/error" element={<ErrorPage />} />
      </Route>
    </Routes>
  );
}
