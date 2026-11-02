import { AuthProvider } from "./AuthProvider";
import { QueryProvider } from "./QueryProvider";

// Composed app providers (Phase 3 step 2): AuthProvider keeps ownership of
// token/user state + session lifecycle; QueryProvider owns the query cache.
// Order matters: AuthProvider must wrap QueryProvider so queries can read
// auth state via context.
export function AppProviders({ children }) {
  return (
    <AuthProvider>
      <QueryProvider>{children}</QueryProvider>
    </AuthProvider>
  );
}
