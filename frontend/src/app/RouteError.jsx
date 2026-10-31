import { useRouteError } from "react-router-dom";
import { ErrorPage } from "./ErrorPage";

// Route-level error boundary (Phase 3 step 3 / plan bullet 2): any render
// error inside a route subtree lands here instead of white-screening the app.
// Attaches once via the parent layout route in ./router.jsx.
export function RouteError() {
  const error = useRouteError();
  console.error("Route error:", error);

  return <ErrorPage />;
}
