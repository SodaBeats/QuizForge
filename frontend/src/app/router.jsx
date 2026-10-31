import { Routes, Route } from "react-router-dom";
import QuizMakerPage from "../pages/teacher/QuizMakerPage";
import LoginPage from "../pages/Login";
import QuizzesPage from "../pages/teacher/QuizzesPage";
import StudentTokenPage from "../pages/student/StudentTokenPage";
import StudentQuizPage from "../pages/student/StudentQuizPage";
import QuizResultDashboard from "../pages/teacher/QuizResultDashboard";
import ClassesPage from "../pages/teacher/ClassesPage";
import ErrorPage from "./ErrorPage";
import RootRedirector from "./guards/RootRedirector";
import {
  RequireRoleTeacher,
  RequireRoleStudent,
} from "./guards/RequireRole";

// Route table (Phase 3 step 2): moved verbatim out of App.jsx; the two inline
// guards became RequireRoleTeacher / RequireRoleStudent with identical
// behavior (step 3 changes the redirect semantics, not here).
export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirector />} />

      <Route
        path="/teacher"
        element={
          <RequireRoleTeacher>
            <QuizMakerPage />
          </RequireRoleTeacher>
        }
      />
      <Route
        path="/teacher/quizzes"
        element={
          <RequireRoleTeacher>
            <QuizzesPage />
          </RequireRoleTeacher>
        }
      />
      <Route
        path="/teacher/quizzes/:quizId"
        element={
          <RequireRoleTeacher>
            <QuizResultDashboard />
          </RequireRoleTeacher>
        }
      />
      <Route
        path="/teacher/classes"
        element={
          <RequireRoleTeacher>
            <ClassesPage />
          </RequireRoleTeacher>
        }
      />
      <Route
        path="/student"
        element={
          <RequireRoleStudent>
            <StudentTokenPage />
          </RequireRoleStudent>
        }
      />
      <Route
        path="/student/quiz/:quizToken"
        element={
          <RequireRoleStudent>
            <StudentQuizPage />
          </RequireRoleStudent>
        }
      />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/error" element={<ErrorPage />} />
    </Routes>
  );
}
