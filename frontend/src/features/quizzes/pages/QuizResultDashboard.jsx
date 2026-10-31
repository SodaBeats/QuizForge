import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import TopBar from "../../../components/layout/TopBar";
import ResultsLeaderboard from "../components/ResultsLeaderboard";
import ResultsMainPanel from "../components/ResultsMainPanel";
import { useQuizDashboard } from "../api/queries.js";

const DEFAULT_METRICS = [
  { label: "Total Takers", value: "No Data Yet", sub: "unique students" },
  { label: "Average Score", value: "No Data Yet", sub: "quiz average" },
  { label: "Highest Score", value: "No Data Yet", sub: "No Data Yet" },
  { label: "Lowest Score", value: "No Data Yet", sub: "quiz minimum" },
];

const DEFAULT_DASHBOARD_DATA = {
  metrics: DEFAULT_METRICS,
  students: [],
  questions: [],
  scoreDistribution: [],
  classesAverage: [],
};

function buildMetrics(data) {
  return [
    {
      label: "Total takers",
      value: data.totalTakers > 0 ? data.totalTakers : "No Data",
      sub: "unique students",
    },
    {
      label: "Average score",
      value: data.quizAverage > 0 ? `${data.quizAverage}%` : "No Data",
      sub: "quiz average",
    },
    {
      label: "Highest score",
      value: data.highestScore > 0 ? `${data.highestScore}%` : "No Data",
      sub: data.highestScorer,
    },
    {
      label: "Lowest score",
      value: data.totalTakers > 0 ? `${data.lowestScore}%` : "No Data",
      sub: "quiz minimum",
    },
  ];
}

function buildQuestionCorrectionRate(data) {
  return data.map((q) => {
    return {
      id: q.questionId,
      label: q.questionText,
      pct: q.successRate,
    };
  });
}

function getScoreDistribution(data) {
  const buckets = [
    { label: "0-20", min: 0, max: 20, count: 0 },
    { label: "21-40", min: 21, max: 40, count: 0 },
    { label: "41-60", min: 41, max: 60, count: 0 },
    { label: "61-80", min: 61, max: 80, count: 0 },
    { label: "81-100", min: 81, max: 100, count: 0 },
  ];

  data.forEach((student) => {
    const bucket = buckets.find(
      (b) => student.score >= b.min && student.score <= b.max,
    );
    if (bucket) bucket.count++;
  });

  return buckets.map((b) => b.count);
}

export default function QuizResultDashboard() {
  const { quizId } = useParams();
  const [mobileTab, setMobileTab] = useState("results"); // mobile-only panel switcher — purely UI state, no data logic

  const { data: dashboardData, error } = useQuizDashboard(quizId);

  useEffect(() => {
    if (error) {
      console.error(error);
      toast.error(
        error.message ||
          "Something went wrong while fetching dashboard data",
      );
    }
  }, [error]);

  const results = dashboardData
    ? {
        metrics: buildMetrics(dashboardData.metrics),
        students: dashboardData.students,
        questions: buildQuestionCorrectionRate(dashboardData.questions),
        scoreDistribution: getScoreDistribution(dashboardData.scores),
        classesAverage: dashboardData.classesAverage,
      }
    : DEFAULT_DASHBOARD_DATA;

  const metrics = results.metrics;
  const students = results.students;
  const questions = results.questions;
  const scoreDistribution = results.scoreDistribution;
  const classesRanking = results.classesAverage;

  return (
    <div className="h-screen flex flex-col bg-canvas text-inkondark alt-display-root font-displayAlt">
      <TopBar />

      {/* Mobile/tablet panel switcher — hidden on desktop, where both panels show at once */}
      <div className="flex lg:hidden border-b border-muted/20 bg-canvas font-body">
        {[
          { key: "results", label: "Results" },
          { key: "leaderboard", label: "Leaderboard" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setMobileTab(tab.key)}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors relative ${
              mobileTab === tab.key
                ? "text-accent"
                : "text-muted hover:text-inkondark"
            }`}
          >
            {tab.label}
            {mobileTab === tab.key && (
              <span className="absolute left-0 bottom-0 w-full h-[2px] bg-accent" />
            )}
          </button>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-y-auto lg:overflow-hidden">
        {/* Main content area */}
        <div
          className={`${
            mobileTab === "results" ? "flex" : "hidden"
          } lg:contents`}
        >
          <ResultsMainPanel
            METRICS={metrics}
            DIFFICULTY={questions}
            SCORES={scoreDistribution}
          />
        </div>
        <div
          className={`${
            mobileTab === "leaderboard" ? "flex h-full" : "hidden"
          } lg:contents`}
        >
          <ResultsLeaderboard STUDENTS={students} classes={classesRanking} />
        </div>
      </div>
    </div>
  );
}
