/* Exam Attempts page — /teacher/quizzes/:quizId/attempts (mock data only).
   Two panels: read-only exam details (left) and the student attempts list
   (right). Mobile switches between them via the AppShell panel tabs. */

import { useState } from "react";
import { useParams } from "react-router-dom";
import { AppShell } from "../../../components/layout/AppShell";
import { ExamDetailsPanel } from "../components/ExamDetailsPanel";
import { getExam } from "../lib/attempts.js";

const TABS = [
  { key: "details", label: "Details" },
  { key: "attempts", label: "Attempts" },
];

export function ExamAttemptsPage() {
  const { quizId } = useParams();
  const [mobileTab, setMobileTab] = useState("details"); // mobile-only panel switcher — purely UI state

  const exam = getExam(quizId);

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
          children: <AttemptsPlaceholder found={Boolean(exam)} />,
        },
      ]}
    />
  );
}

/* Phase 1 stub — the real list lands in Phase 2. */
function AttemptsPlaceholder({ found }) {
  return (
    <div className="flex-1 min-w-0 flex flex-col font-body p-3">
      <div className="flex-1 flex flex-col rounded-lg bg-surface overflow-hidden border border-muted/20">
        <header className="p-4 bg-specialsurface border-b border-muted/20">
          <p className="text-xs font-display font-semibold text-muted uppercase tracking-widest">
            Student attempts
          </p>
        </header>
        <div className="flex-1 flex items-center justify-center p-6 text-center">
          <p className="text-sm text-muted">
            {found ? "No submissions yet" : "No attempt data for this exam"}
          </p>
        </div>
      </div>
    </div>
  );
}
