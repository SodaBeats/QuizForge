import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "./AuthProvider";
import LoadingScreen from "./LoadingScreen";

export default function RootRedirector() {
  const { loading, userInfo } = useContext(AuthContext);

  if (loading) {
    return <LoadingScreen fullScreen />;
  }

  if (!userInfo) {
    return <Navigate to="/login" replace />;
  }

  // Send them where they belong based on their role
  return userInfo.role === "teacher" ? (
    <Navigate to="/teacher" replace />
  ) : (
    <Navigate to="/student" replace />
  );
}
