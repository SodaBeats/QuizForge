/* Exam Attempts page — /teacher/quizzes/:quizId/attempts (mock data only).
   Two panels: read-only exam details (left) and the student attempts list
   (right). Mobile switches between them via the AppShell panel tabs. */

import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { AppShell } from "../../../components/layout/AppShell";
import { ExamDetailsPanel } from "../components/ExamDetailsPanel";
import { AttemptsPanel } from "../components/AttemptsPanel";
import {
  filterByClass,
  filterBySearch,
  getAttempts,
  getExam,
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

  const exam = getExam(quizId);

  // Restricted exams only get class tabs; the active tab falls back to the
  // first class whenever the selection doesn't belong to this exam — that
  // derived fallback resets the tab on quizId change without an effect.
  const classes =
    exam?.accessibility === "restricted" ? exam.allowedClasses : [];
  const activeClassId =
    classes.find((cls) => cls.id === selectedClassId)?.id ??
    classes[0]?.id ??
    null;

  // Group once per quizId, then layer the class tab and the name search on
  // top so counts and list always agree.
  const groups = useMemo(
    () =>
      exam ? groupAttemptsByStudent(getAttempts(quizId)) : [],
    [exam, quizId],
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
          children: <ExamDetailsPanel exam={exam} />,
        },
        {
          key: "attempts",
          visible: mobileTab === "attempts",
          children: (
            <AttemptsPanel
              found={Boolean(exam)}
              groups={filteredGroups}
              query={query}
              onQueryChange={setQuery}
              classes={classes}
              activeClassId={activeClassId}
              onClassChange={setSelectedClassId}
            />
          ),
        },
      ]}
    />
  );
}
