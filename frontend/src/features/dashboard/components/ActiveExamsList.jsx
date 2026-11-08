import { useState } from "react";
import { useActiveExams } from "../api/queries.js";
import { formatSubmissionCount } from "../api/dashboard.api.js";
import { formatDueDate } from "../lib/format.js";
import { ExamListPanel } from "./ExamListPanel";

// Paginated active-exams list (title / due date / submission count).
// Owns its page state — Phase 4 of the dashboard scaffold.
export function ActiveExamsList() {
  const [page, setPage] = useState(1);
  const query = useActiveExams(page);

  return (
    <ExamListPanel
      title="Active exams"
      query={query}
      emptyMessage="No active exams"
      onPageChange={setPage}
      renderRow={(exam) => <ActiveExamRow exam={exam} />}
    />
  );
}

function ActiveExamRow({ exam }) {
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

      <div className="w-28 shrink-0">
        <p className="text-xs text-muted whitespace-nowrap">
          Submissions:{" "}
          <span className="text-inkondark font-medium">
            {formatSubmissionCount(exam)}
          </span>
        </p>
      </div>
    </div>
  );
}
