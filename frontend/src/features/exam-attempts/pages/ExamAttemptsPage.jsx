/* Exam Attempts page — /teacher/quizzes/:quizId/attempts.
   Two panels: read-only exam details (left) and the student attempts list
   (right), both fetched on load. Page-level query state (loading / error /
   not-found) is passed down to both panels; clicking a list row swaps the
   attempts panel to that attempt's detail view, which fetches the answers
   itself, and its arrow returns to the list. Mobile switches between the
   panels via the AppShell panel tabs. */

import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { AppShell } from "../../../components/layout/AppShell";
import { ExamDetailsPanel } from "../components/ExamDetailsPanel";
import { AttemptsPanel } from "../components/AttemptsPanel";
import { useExamAttempts, useExamDetails } from "../api/queries.js";
import {
  filterByClass,
  filterBySearch,
  groupAttemptsByStudent,
} from "../lib/attempts.js";

const TABS = [
  { key: "details", label: "Details" },
  { key: "attempts", label: "Attempts" },
];

export function ExamAttemptsPage() {
  const { quizId } = useParams();
  const [mobileTab, setMobileTab] = useState("details"); // mobile-only panel switcher — purely UI state
  const [query, setQuery] = useState("");
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [selectedAttempt, setSelectedAttempt] = useState(null); // { student, attempt } → detail view in the attempts panel

  const examQuery = useExamDetails(quizId);
  const listQuery = useExamAttempts(quizId);

  // Both routes run the same ownership check, so a 404 from either query
  // means the quiz doesn't exist (or isn't this teacher's) → not-found.
  // Precedence: not-found > loading > error (all three settle together).
  const notFound =
    examQuery.error?.status === 404 || listQuery.error?.status === 404;
  const loading =
    !notFound && (examQuery.isPending || listQuery.isPending);
  // ApiError.message is already normalized by apiRequest (getApiErrorMessage
  // at throw time), so it's passed straight to ErrorState.
  const failure = [examQuery, listQuery].find(
    (q) => q.isError && q.error?.status !== 404,
  );
  const error =
    !notFound && !loading && failure
      ? failure.error?.message || "Something went wrong. Please try again."
      : null;

  const exam = notFound ? undefined : examQuery.data;

  // Restricted exams only get class tabs; the active tab falls back to the
  // first class whenever the selection doesn't belong to this exam — that
  // derived fallback resets the tab on quizId change without an effect.
  const classes =
    exam?.accessibility === "restricted" ? exam.allowedClasses : [];
  const activeClassId =
    classes.find((cls) => cls.id === selectedClassId)?.id ??
    classes[0]?.id ??
    null;

  // Group once per list payload, then layer the class tab and the name
  // search on top so counts and list always agree.
  const groups = useMemo(
    () =>
      listQuery.data
        ? groupAttemptsByStudent(
            listQuery.data.attempts,
            listQuery.data.students,
          )
        : [],
    [listQuery.data],
  );
  const classGroups = useMemo(
    () => (activeClassId == null ? groups : filterByClass(groups, activeClassId)),
    [groups, activeClassId],
  );
  const filteredGroups = useMemo(
    () => filterBySearch(classGroups, query),
    [classGroups, query],
  );

  return (
    <AppShell
      tabs={TABS}
      activeTab={mobileTab}
      onChange={setMobileTab}
      panels={[
        {
          key: "details",
          visible: mobileTab === "details",
          children: (
            <ExamDetailsPanel exam={exam} loading={loading} error={error} />
          ),
        },
        {
          key: "attempts",
          visible: mobileTab === "attempts",
          children: (
            <AttemptsPanel
              found={!notFound}
              loading={loading}
              error={error}
              groups={filteredGroups}
              query={query}
              onQueryChange={setQuery}
              classes={classes}
              activeClassId={activeClassId}
              onClassChange={setSelectedClassId}
              onSelectAttempt={setSelectedAttempt}
              quizId={quizId}
              selectedAttempt={selectedAttempt}
              onBack={() => setSelectedAttempt(null)}
            />
          ),
        },
      ]}
    />
  );
}
