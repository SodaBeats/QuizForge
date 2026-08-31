import { useContext, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Navigate } from "react-router-dom";
import toast from "react-hot-toast";
import TopBar from "../components/TopBar";
import ResultsLeaderboard from "../components/ResultsLeaderboard";
import ResultsMainPanel from "../components/ResultsMainPanel";
import { AuthContext } from "../components/AuthProvider";

const backendHost = import.meta.env.VITE_BACKEND_HOST;

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
  classAverage: [],
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

async function fetchDashboardData({ quizId, authFetch, logout }) {
  try {
    const existRes = await authFetch(
      `${backendHost}/api/quizzes/${quizId}/attempts`,
      {
        method: "GET",
        credentials: "include",
      },
    );
    const attemptsExist = await existRes.json();

    if (!attemptsExist.success) {
      return DEFAULT_DASHBOARD_DATA;
    }

    const [metricRes, studentsRes, questionsRes, scoreRes, classesAverageRes] =
      await Promise.all([
        authFetch(`${backendHost}/api/quizzes/${quizId}/metrics`, {
          method: "GET",
          credentials: "include",
        }),
        authFetch(`${backendHost}/api/quizzes/${quizId}/students`, {
          method: "GET",
          credentials: "include",
        }),
        authFetch(`${backendHost}/api/quizzes/${quizId}/questions`, {
          method: "GET",
          credentials: "include",
        }),
        authFetch(`${backendHost}/api/quizzes/${quizId}/score`, {
          method: "GET",
          credentials: "include",
        }),
        authFetch(`${backendHost}/api/quizzes/${quizId}/classesavg`, {
          method: "GET",
          credentials: "include",
        }),
      ]);

    const [metrics, students, questions, scores, classesAverage] =
      await Promise.all([
        metricRes.json(),
        studentsRes.json(),
        questionsRes.json(),
        scoreRes.json(),
        classesAverageRes.json(),
      ]);

    if (!metrics.success) {
      if (metrics.message === "Unauthorized action") {
        await logout();
        return DEFAULT_DASHBOARD_DATA;
      }
      throw new Error(
        metrics?.message ||
          metrics?.error ||
          "Something went wrong while fetching metrics",
      );
    }

    if (!students.success) {
      if (students.message === "Unauthorized action") {
        await logout();
        return DEFAULT_DASHBOARD_DATA;
      }
      throw new Error(
        students?.message ||
          students?.error ||
          "Something went wrong while fetching student ranking",
      );
    }

    if (!questions.success) {
      if (questions.message === "Unauthorized action") {
        await logout();
        return DEFAULT_DASHBOARD_DATA;
      }
      throw new Error(
        questions?.message ||
          questions?.error ||
          "Something went wrong while fetching questions data",
      );
    }

    if (!scores.success) {
      if (scores.message === "Unauthorized action") {
        await logout();
        return DEFAULT_DASHBOARD_DATA;
      }
      throw new Error(
        scores?.message ||
          scores?.error ||
          "Something went wrong while fetching score distribution data",
      );
    }
    if (!classesAverage.success) {
      if (classesAverage.message === "Unauthorized action") {
        await logout();
        return DEFAULT_DASHBOARD_DATA;
      }
      throw new Error(
        classesAverage?.message ||
          classesAverage?.error ||
          "Something went wrong while fetching classes average ranking",
      );
    }

    return {
      metrics: buildMetrics(metrics),
      students: students.data,
      questions: buildQuestionCorrectionRate(questions.data),
      scoreDistribution: getScoreDistribution(scores.data),
      classesAverage: classesAverage.data,
    };
  } catch (error) {
    console.error(error);
    toast.error(
      error.message ||
        error.error ||
        "Something went wrong while fetching dashboard data",
    );
    return DEFAULT_DASHBOARD_DATA;
  }
}

export default function QuizResultDashboard() {
  const { authFetch, logout } = useContext(AuthContext);
  const { quizId } = useParams();
  const [mobileTab, setMobileTab] = useState("results"); // mobile-only panel switcher — purely UI state, no data logic

  const { data: dashboardData } = useQuery({
    queryKey: ["quizResultDashboard", quizId],
    queryFn: () => fetchDashboardData({ quizId, authFetch, logout }),
    enabled: !!quizId,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const metrics = dashboardData?.metrics ?? DEFAULT_DASHBOARD_DATA.metrics;
  const students = dashboardData?.students ?? DEFAULT_DASHBOARD_DATA.students;
  const questions =
    dashboardData?.questions ?? DEFAULT_DASHBOARD_DATA.questions;
  const scoreDistribution =
    dashboardData?.scoreDistribution ??
    DEFAULT_DASHBOARD_DATA.scoreDistribution;
  const classesRanking =
    dashboardData?.classesAverage ?? DEFAULT_DASHBOARD_DATA.classAverage;

  if (!backendHost) {
    return <Navigate to="/error" replace />;
  }

  return (
    <div className="h-screen flex flex-col bg-[#0D0906] text-[#F5F2EC]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
        .font-display { font-family: 'Space Grotesk', sans-serif; }
        .font-body { font-family: 'Inter', sans-serif; }
      `}</style>

      <TopBar />

      {/* Mobile/tablet panel switcher — hidden on desktop, where both panels show at once */}
      <div className="flex lg:hidden border-b border-[#2A241C] bg-[#12100D] font-body">
        {[
          { key: "results", label: "Results" },
          { key: "leaderboard", label: "Leaderboard" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setMobileTab(tab.key)}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors relative ${
              mobileTab === tab.key
                ? "text-[#FF7A1A]"
                : "text-[#7A756A] hover:text-[#C9C4B3]"
            }`}
          >
            {tab.label}
            {mobileTab === tab.key && (
              <span className="absolute left-0 bottom-0 w-full h-[2px] bg-[#FF7A1A]" />
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
