/* Panel 2 — student attempts: header (counts + name search) over a
   scrollable list of grouped rows. Single-attempt students render one
   compact row; multi-attempt students render a boxed group (newest first).
   Clicking a row swaps the whole panel to that attempt's inline detail
   view (AttemptDetailView), whose arrow returns to the list.
   `loading`/`error` (non-404) come from the page's query state; a 404
   renders the not-found body via `found = false`. */

import { useEffect, useRef } from "react";
import { EmptyState } from "../../../components/ui/EmptyState";
import { Spinner } from "../../../components/ui/Spinner";
import { ErrorState } from "../../../components/ui/ErrorState";
import { ClassTabs } from "./ClassTabs";
import { StudentAttemptRow } from "./StudentAttemptRow";
import { StudentAttemptsBox } from "./StudentAttemptsBox";
import { AttemptDetailView } from "./AttemptDetailView";

const searchInputClass =
  "w-full sm:w-56 bg-darkslate rounded-md px-3 py-1.5 text-sm text-inkondark placeholder:text-muted border border-muted/30 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 transition-all font-body";

export function AttemptsPanel({
  found,
  loading = false,
  error = null,
  groups,
  query,
  onQueryChange,
  classes,
  activeClassId,
  onClassChange,
  onSelectAttempt,
  quizId,
  selectedAttempt,
  onBack,
}) {
  const listRef = useRef(null);
  const restoreListFocusRef = useRef(false);

  // Leaving the detail remounts the list — hand focus to the list
  // container so keyboard users don't drop back to <body>. The flag keeps
  // the initial mount (nothing to restore) from stealing focus.
  const handleBack = () => {
    restoreListFocusRef.current = true;
    onBack();
  };
  useEffect(() => {
    if (selectedAttempt == null && restoreListFocusRef.current) {
      restoreListFocusRef.current = false;
      listRef.current?.focus();
    }
  }, [selectedAttempt]);

  const attemptCount = groups.reduce(
    (total, group) => total + group.attempts.length,
    0,
  );

  // Selected row → detail view replaces the list chrome (counts, search,
  // class tabs) until the arrow sends the user back.
  if (selectedAttempt) {
    return (
      <div className="flex-1 min-w-0 flex flex-col font-body p-3">
        <div className="flex-1 flex flex-col rounded-lg bg-surface overflow-hidden border border-muted/20">
          <AttemptDetailView
            attempt={selectedAttempt.attempt}
            student={selectedAttempt.student}
            quizId={quizId}
            attemptId={selectedAttempt.attempt.id}
            onBack={handleBack}
          />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 min-w-0 flex flex-col font-body p-3">
        <div className="flex-1 flex flex-col rounded-lg bg-surface overflow-hidden border border-muted/20">
          <PanelHeader />
          <div className="flex-1 flex items-center justify-center p-6">
            <Spinner />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 min-w-0 flex flex-col font-body p-3">
        <div className="flex-1 flex flex-col rounded-lg bg-surface overflow-hidden border border-muted/20">
          <PanelHeader />
          <div className="flex-1 flex items-center justify-center p-6 text-center">
            <ErrorState message={error} />
          </div>
        </div>
      </div>
    );
  }

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

        <ClassTabs
          classes={classes}
          activeClassId={activeClassId}
          onChange={onClassChange}
        />

        <div
          ref={listRef}
          tabIndex={-1}
          className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1.5 focus:outline-none"
        >
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
                  onSelect={onSelectAttempt}
                />
              ) : (
                <StudentAttemptsBox
                  key={student.id}
                  student={student}
                  attempts={attempts}
                  onSelect={onSelectAttempt}
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
