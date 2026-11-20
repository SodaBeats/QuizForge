import { AdminLayout } from "../components/AdminLayout";
import { EmptyState } from "../../../components/ui/EmptyState";

// Placeholder — exam management lands in a later pass (backend contract
// for /admin/exams is already covered by the dashboard's recent-exams list).
export function AdminExamsPage() {
  return (
    <AdminLayout>
      <h1 className="text-xl font-display font-semibold text-inkondark">
        Exam Management
      </h1>
      <div className="rounded-lg bg-surface border border-muted/20 p-4">
        <EmptyState message="Exam management is coming soon." />
      </div>
    </AdminLayout>
  );
}
