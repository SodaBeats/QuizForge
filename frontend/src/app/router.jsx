import { Routes, Route, Outlet } from "react-router-dom";
import QuizMakerPage from "../pages/teacher/QuizMakerPage";
import LoginPage from "../features/auth/pages/LoginPage";
import QuizzesPage from "../pages/teacher/QuizzesPage";
import StudentTokenPage from "../features/student-quiz/pages/StudentTokenPage";
import StudentQuizPage from "../features/student-quiz/pages/StudentQuizPage";
import QuizResultDashboard from "../pages/teacher/QuizResultDashboard";
import ClassesPage from "../features/classes/pages/ClassesPage";
import ErrorPage from "./ErrorPage";
import RouteError from "./RouteError";
import RootRedirector from "./guards/RootRedirector";
import { RequireRole } from "./guards/RequireRole";

// Route table (Phase 3 step 2, behavior pass in step 3): the guards are one
// RequireRole keyed by role — logged out → /login with state.from, wrong
// role → that role's home. The parent layout route attaches a single
// errorElement for the whole tree.
export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<Outlet />} errorElement={<RouteError />}>
        <Route path="/" element={<RootRedirector />} />

        <Route
          path="/teacher"
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
              <QuizResultDashboard />
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
