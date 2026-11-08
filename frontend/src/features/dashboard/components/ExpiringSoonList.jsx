import { useState } from "react";
import { useExpiringExams } from "../api/queries.js";
import { formatSubmissionCount } from "../api/dashboard.api.js";
import { formatDueDate, formatTimeLeft } from "../lib/format.js";
import { ExamListPanel } from "./ExamListPanel";

// Paginated expiring-soon list (title / due date / time left) — the active
// exams due within the next 72 hours, soonest first. Owns its page state.
export function ExpiringSoonList() {
  const [page, setPage] = useState(1);
  const query = useExpiringExams(page);

  return (
    <ExamListPanel
      title="Expiring soon"
      query={query}
      emptyMessage="No exams expiring soon"
      onPageChange={setPage}
      renderRow={(exam) => <ExpiringExamRow exam={exam} />}
    />
  );
}

function ExpiringExamRow({ exam }) {
  return (
    <div className="rounded-md bg-darkslate border border-muted/20 px-3 py-2.5 flex items-center gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-inkondark truncate">
          {exam.quizTitle}
        </p>
        <p className="text-xs text-muted mt-0.5">
          Due {formatDueDate(exam.dueDate)}
        </p>
      </div>

      <div className="shrink-0 flex flex-col items-end gap-1">
        <p className="text-xs text-muted whitespace-nowrap">
          Submissions:{" "}
          <span className="font-medium text-inkondark">
            {formatSubmissionCount(exam)}
          </span>
        </p>
        <span className="text-xs font-medium text-red-400 whitespace-nowrap">
          {formatTimeLeft(exam.dueDate)}
        </span>
      </div>
    </div>
  );
}
