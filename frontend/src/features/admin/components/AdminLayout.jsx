import { AdminSidebar } from "./AdminSidebar";

// Admin page frame: sidebar + scrollable main, deliberately WITHOUT the
// topbar the teacher/student pages carry (admin spec: sidebar only).
// Same h-dvh skeleton as DashboardPage so the sidebar behaves identically
// (horizontal strip on mobile, vertical rail from lg up).
export function AdminLayout({ children }) {
  return (
    <div className="h-dvh min-h-0 flex flex-col bg-canvas text-inkondark">
      <div className="flex-1 min-h-0 min-w-0 flex flex-col lg:flex-row overflow-hidden">
        <AdminSidebar />

        <main className="flex-1 min-h-0 min-w-0 overflow-y-auto p-4 lg:p-6 space-y-4 lg:space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
