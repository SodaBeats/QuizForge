import { Toaster } from "react-hot-toast";
import AppRoutes from "./router";

// App = page frame + routes only (Phase 3 step 2). The route table lives in
// ./router; providers are composed in ./providers and wrap this in main.jsx.
export default function App() {
  return (
    <>
      <Toaster position="top-center" />
      <AppRoutes />
    </>
  );
}
