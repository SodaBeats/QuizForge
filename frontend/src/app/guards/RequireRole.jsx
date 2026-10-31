import { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "../providers/AuthProvider";

// Where each role belongs (used for the wrong-role redirect).
const ROLE_HOME = { teacher: "/teacher", student: "/student" };

// Single route guard (Phase 3 step 3 / plan bullet 2):
// - logged out → /login, carrying state.from so Login can return the user
//   to the page they originally asked for after signing in
// - authenticated but the wrong role → that role's home (not /login)
// - right role → children
export function RequireRole({ role, children }) {
  const { token, userInfo } = useContext(AuthContext);
  const location = useLocation();

  const home = userInfo?.role ? ROLE_HOME[userInfo.role] : undefined;

  if (!token || !home) {
    // No session (or an unknown role we can't route home) → login; keep the
    // requested location so login can send the user back after signing in.
    // `replace` so the guarded URL doesn't linger in history (Back would
    // otherwise bounce straight back into this redirect).
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (userInfo.role !== role) {
    return <Navigate to={home} replace />;
  }

  return children;
}
