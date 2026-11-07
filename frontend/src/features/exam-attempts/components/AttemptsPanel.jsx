/* Panel 2 — student attempts: header (counts + name search) over a
   scrollable list of grouped rows. Single-attempt students render one
   compact row; multi-attempt students render a boxed group (newest first).
   Tab filtering layers on top in Phase 3. */

import { EmptyState } from "../../../components/ui/EmptyState";
import { StudentAttemptRow } from "./StudentAttemptRow";
import { StudentAttemptsBox } from "./StudentAttemptsBox";

const searchInputClass =
  "w-full sm:w-56 bg-darkslate rounded-md px-3 py-1.5 text-sm text-inkondark placeholder:text-muted border border-muted/30 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 transition-all font-body";

export function AttemptsPanel({
  found,
  groups,
  query,
  onQueryChange,
}) {
  const attemptCount = groups.reduce(
    (total, group) => total + group.attempts.length,
    0,
  );

  if (!found) {
    return (
      <div className="flex-1 min-w-0 flex flex-col font-body p-3">
        <div className="flex-1 flex flex-col rounded-lg bg-surface overflow-hidden border border-muted/20">
          <PanelHeader />
          <div className="flex-1 flex items-center justify-center p-6 text-center">
            <p className="text-sm text-muted">No attempt data for this exam</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-w-0 flex flex-col font-body p-3">
      <div className="flex-1 flex flex-col rounded-lg bg-surface overflow-hidden border border-muted/20">
        <PanelHeader>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <p className="text-xs text-muted whitespace-nowrap">
              {groups.length} student{groups.length === 1 ? "" : "s"} •{" "}
              {attemptCount} attempt{attemptCount === 1 ? "" : "s"}
            </p>
            <input
              type="search"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Search students…"
              aria-label="Search students by name"
              className={searchInputClass}
            />
          </div>
        </PanelHeader>

        <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1.5">
          {groups.length === 0 ? (
            <EmptyState
              message={
                query.trim()
                  ? "No students match your search"
                  : "No submissions yet"
              }
            />
          ) : (
            groups.map(({ student, attempts }) =>
              attempts.length === 1 ? (
                <StudentAttemptRow
                  key={student.id}
                  student={student}
                  attempt={attempts[0]}
                />
              ) : (
                <StudentAttemptsBox
                  key={student.id}
                  student={student}
                  attempts={attempts}
                />
              ),
            )
          )}
        </div>
      </div>
    </div>
  );
}

function PanelHeader({ children }) {
  return (
    <header className="p-3 sm:p-4 bg-specialsurface border-b border-muted/20">
      <p className="text-xs font-display font-semibold text-muted uppercase tracking-widest mb-2">
        Student attempts
      </p>
      {children}
    </header>
  );
}
