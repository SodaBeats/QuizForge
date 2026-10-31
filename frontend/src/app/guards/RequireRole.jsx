import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../providers/AuthProvider";

// Phase 3 step 2 (mechanical extraction from App.jsx): these are the two
// route guards, renamed to their RequireRole* names but with byte-for-byte
// identical redirect behavior (still <Navigate to="/login" />, no state.from
// yet). Step 3 merges them into one RequireRole and changes the redirect
// semantics — that change is isolated there on purpose.

export function RequireRoleTeacher({ children }) {
  const { token, userInfo } = useContext(AuthContext);
  if (token && userInfo?.role === "teacher") {
    return children;
  } else {
    return <Navigate to="/login" />;
  }
}

export function RequireRoleStudent({ children }) {
  const { token, userInfo } = useContext(AuthContext);
  if (token && userInfo?.role === "student") {
    return children;
  } else {
    return <Navigate to="/login" />;
  }
}
