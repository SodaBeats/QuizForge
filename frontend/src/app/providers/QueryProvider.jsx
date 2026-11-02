import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../../lib/queryClient";

// One QueryClientProvider with the global defaults from lib/queryClient.js
// (Phase 3 step 2): call sites never pass staleTime/refetchOnWindowFocus.
export function QueryProvider({ children }) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
