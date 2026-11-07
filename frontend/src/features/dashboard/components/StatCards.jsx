import { Spinner } from "../../../components/ui/Spinner";
import { ErrorState } from "../../../components/ui/ErrorState";
import { useDashboardStats } from "../api/queries.js";
import { StatCard } from "./StatCard";

// Top row of the dashboard: active exams, total students, average score
// (across all quizzes), and drafts — one stats query feeds all four tiles.
export function StatCards() {
  const { data, isPending, isError } = useDashboardStats();

  if (isPending) {
    return (
      <div
        role="status"
        aria-label="Loading stats"
        className="flex items-center justify-center rounded-lg bg-surface border border-muted/20 p-6"
      >
        <Spinner />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg bg-surface border border-muted/20 p-2">
        <ErrorState message="Failed to load dashboard stats" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <StatCard label="Active exams" value={data.activeExams} />
      <StatCard label="Total students" value={data.totalStudents} />
      <StatCard label="Average score" value={`${data.averageScore}%`} />
      <StatCard label="Drafts" value={data.drafts} />
    </div>
  );
}
