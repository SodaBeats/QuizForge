import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../providers/AuthProvider";

// Verification gate for the teacher branches. Runs INSIDE RequireRole, so
// session and role are already settled — this asks one question: has an admin
// flipped is_verified yet? An unverified teacher has a perfectly valid login
// but no access, so park them on /awaiting-verification instead of rendering
// the page they asked for.
export function RequireVerified({ children }) {
  const { userInfo } = useContext(AuthContext);

  if (!userInfo?.isVerified) {
    // `replace` so Back doesn't bounce between the guarded page and the
    // awaiting screen.
    return <Navigate to="/awaiting-verification" replace />;
  }

  return children;
}
