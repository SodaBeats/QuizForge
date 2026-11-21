import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../providers/AuthProvider";
import { LoadingScreen } from "../../components/layout/LoadingScreen";

export function RootRedirector() {
  const { loading, userInfo } = useContext(AuthContext);

  if (loading) {
    return <LoadingScreen fullScreen />;
  }

  if (!userInfo) {
    return <Navigate to="/login" replace />;
  }

  // Send them where they belong based on their role (unknown roles keep the
  // old fallback to the student home — only teacher/student/admin exist).
  if (userInfo.role === "teacher") {
    return <Navigate to="/teacher" replace />;
  }
  if (userInfo.role === "admin") {
    return <Navigate to="/admin" replace />;
  }
  return <Navigate to="/student" replace />;
}
