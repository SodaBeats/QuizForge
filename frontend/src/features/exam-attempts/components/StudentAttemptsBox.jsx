/* Box for a student with multiple attempts: student name as the header,
   then one compact row per attempt (newest first), score + date columns
   aligned with StudentAttemptRow. */

import { formatSubmittedAt } from "../lib/format.js";

export function StudentAttemptsBox({ student, attempts }) {
  return (
    <div className="rounded-lg bg-darkslate border border-muted/20 overflow-hidden font-body">
      <div className="flex items-center gap-3 px-3 py-1.5 bg-specialsurface border-b border-muted/20">
        <span className="flex-1 min-w-0 truncate text-sm font-semibold text-inkondark">
          {student.name}
        </span>
        <span className="shrink-0 text-xs text-muted">
          {attempts.length} attempts
        </span>
      </div>

      {attempts.map((attempt) => (
        <div
          key={attempt.id}
          className="flex items-center gap-3 px-3 py-1.5 border-b border-muted/10 last:border-b-0"
        >
          <span className="flex-1 min-w-0" />
          <span className="w-16 shrink-0 text-right text-sm text-inkondark tabular-nums">
            {attempt.rawScore}/{attempt.maxPossibleScore}
          </span>
          <span className="w-36 sm:w-44 shrink-0 text-right text-xs text-muted whitespace-nowrap">
            {formatSubmittedAt(attempt.submittedAt)}
          </span>
        </div>
      ))}
    </div>
  );
}
