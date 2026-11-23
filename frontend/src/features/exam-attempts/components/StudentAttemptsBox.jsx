/* Box for a student with multiple attempts: student name as the header,
   then one compact row per attempt (newest first), score + date columns
   aligned with StudentAttemptRow. Each attempt row is a button that opens
   that attempt's detail view inside the panel; the name header is not
   clickable. */

import { formatSubmittedAt } from "../lib/format.js";
import { StudentAvatar } from "./StudentAvatar";

export function StudentAttemptsBox({ student, attempts, onSelect }) {
  return (
    <div className="rounded-lg bg-darkslate border border-muted/20 overflow-hidden font-body">
      <div className="flex items-center gap-3 px-3 py-1.5 bg-specialsurface border-b border-muted/20">
        <StudentAvatar name={student.name} size="sm" />
        <span className="flex-1 min-w-0 truncate text-sm font-semibold text-inkondark">
          {student.name}
        </span>
        <span className="shrink-0 text-xs text-muted">
          {attempts.length} attempts
        </span>
      </div>

      {attempts.map((attempt) => (
        <button
          key={attempt.id}
          type="button"
          onClick={() => onSelect({ student, attempt })}
          className="w-full text-left flex items-center gap-3 px-3 py-1.5 border-b border-muted/10 last:border-b-0 cursor-pointer hover:bg-muted/10 transition-colors"
        >
          <span className="flex-1 min-w-0" />
          {attempt.status === "needs-review" ? (
            <span className="w-28 shrink-0 text-right text-xs font-medium text-amber-300">
              Needs grading
            </span>
          ) : (
            <span className="w-16 shrink-0 text-right text-sm text-inkondark tabular-nums">
              {attempt.rawScore}/{attempt.maxPossibleScore}
            </span>
          )}
          <span className="w-36 sm:w-44 shrink-0 text-right text-xs text-muted whitespace-nowrap">
            {formatSubmittedAt(attempt.submittedAt)}
          </span>
        </button>
      ))}
    </div>
  );
}
