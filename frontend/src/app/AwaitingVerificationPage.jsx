import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "./providers/AuthProvider";
import { Button } from "../components/ui/Button";

// Landing spot for teachers an admin hasn't verified yet. Reached via
// RequireVerified from every /teacher branch; the route itself sits behind
// RequireRole role="teacher", so logged-out visitors go to /login (with
// state.from) and other roles are sent to their own home before this renders.
export function AwaitingVerificationPage() {
  const { userInfo, logout } = useContext(AuthContext);

  // The only person who can be here and shouldn't see this message is a
  // teacher verified mid-session (or after a reload with a fresh token) —
  // send them to the dashboard instead of a stale "awaiting" screen.
  if (userInfo?.isVerified) {
    return <Navigate to="/teacher" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas p-4">
      <div className="max-w-md w-full bg-ink rounded-md border border-muted/30 p-8 text-center">
        <h1 className="text-3xl text-inkondark font-semibold mb-6">
          Awaiting verification, please wait for Admin confirmation
        </h1>
        {/* Direct logout, no confirm dialog: this screen is a dead end, so
            getting out should take one click. */}
        <Button type="button" onClick={logout}>
          Logout
        </Button>
      </div>
    </div>
  );
}
