/* One compact row for a student with a single attempt:
   name | raw/max score | submission date. */

import { formatSubmittedAt } from "../lib/format.js";

export function StudentAttemptRow({ student, attempt }) {
  return (
    <div className="flex items-center gap-3 px-3 py-1.5 rounded-md bg-darkslate border border-muted/20 font-body">
      <span className="flex-1 min-w-0 truncate text-sm text-inkondark">
        {student.name}
      </span>
      <span className="w-16 shrink-0 text-right text-sm font-medium text-inkondark tabular-nums">
        {attempt.rawScore}/{attempt.maxPossibleScore}
      </span>
      <span className="w-36 sm:w-44 shrink-0 text-right text-xs text-muted whitespace-nowrap">
        {formatSubmittedAt(attempt.submittedAt)}
      </span>
    </div>
  );
}
