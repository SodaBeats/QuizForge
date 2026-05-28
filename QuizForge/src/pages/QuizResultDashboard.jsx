import { useContext } from "react";
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
      value: `${data.lowestScore}%`,
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

    const [metricRes, studentsRes, questionsRes, scoreRes] = await Promise.all([
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
    ]);

    const [metrics, students, questions, scores] = await Promise.all([
      metricRes.json(),
      studentsRes.json(),
      questionsRes.json(),
      scoreRes.json(),
    ]);

    if (!metrics.success) {
      if (metrics.message === "Unauthorized action") {
        await logout();
        return DEFAULT_DASHBOARD_DATA.metrics;
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
        return DEFAULT_DASHBOARD_DATA.students;
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
        return DEFAULT_DASHBOARD_DATA.questions;
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
        return DEFAULT_DASHBOARD_DATA.scoreDistribution;
      }
      throw new Error(
        scores?.message ||
          scores?.error ||
          "Something went wrong while fetching score distribution data",
      );
    }

    return {
      metrics: buildMetrics(metrics),
      students: students.data,
      questions: buildQuestionCorrectionRate(questions.data),
      scoreDistribution: getScoreDistribution(scores.data),
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

  if (!backendHost) {
    return <Navigate to="/error" replace />;
  }

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">
      <TopBar />
      <div className="flex flex-1 min-h-0">
        {/* Main content area */}
        <ResultsMainPanel
          METRICS={metrics}
          DIFFICULTY={questions}
          SCORES={scoreDistribution}
        />
        <ResultsLeaderboard STUDENTS={students} />
      </div>
    </div>
  );
}
