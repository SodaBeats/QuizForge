// ResultsMainPanel.jsx
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { colors } from "../../theme/colors";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

// ── Helpers ────────────────────────────────────────────────────────────────

function difficultyBarClass(pct) {
  if (pct >= 70) return "bg-green-500";
  if (pct >= 50) return "bg-amber-500";
  return "bg-red-500";
}

function difficultyTextClass(pct) {
  if (pct >= 70) return "text-green-400";
  if (pct >= 50) return "text-amber-400";
  return "text-red-400";
}

// ── Sub-components ─────────────────────────────────────────────────────────

function MetricCard({ label, value, sub }) {
  return (
    <div
      className={`flex-1 min-w-[45%] sm:min-w-0 bg-surface-800 rounded-2xl p-3 sm:p-4 flex flex-col justify-between font-body shadow-[6px_6px_14px_rgba(0,0,0,0.4),-4px_-4px_10px_rgba(255,255,255,0.03)]`}
    >
      <p className="text-xs font-medium text-ink-500 uppercase tracking-wider mb-2">
        {label}
      </p>
      <div>
        <p className="text-2xl sm:text-3xl font-display font-bold text-ink-200 leading-none mb-1">
          {value}
        </p>
        <p className="text-xs text-ink-600 truncate">{sub}</p>
      </div>
    </div>
  );
}

function DifficultyRow({ label, pct }) {
  return (
    <div className="flex items-center gap-3 font-body">
      <span className="text-xs text-ink-500 w-24 sm:w-40 flex-shrink-0 truncate">
        {label}
      </span>

      <div className="flex-1 h-2 bg-surface-900 rounded-full overflow-hidden shadow-[inset_2px_2px_4px_rgba(0,0,0,0.4)]">
        <div
          className={`h-full rounded-full transition-all duration-500 ${difficultyBarClass(pct)}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <span
        className={`text-xs font-semibold w-8 text-right flex-shrink-0 ${difficultyTextClass(pct)}`}
      >
        {pct}%
      </span>
    </div>
  );
}

function ReviewRow({ rank, label, pct }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-900 shadow-[inset_3px_3px_6px_rgba(0,0,0,0.4),inset_-3px_-3px_6px_rgba(255,255,255,0.03)] font-body">
      <span className="w-6 h-6 rounded-full bg-red-900/50 text-red-300 text-xs font-bold flex items-center justify-center flex-shrink-0">
        {rank}
      </span>

      <span className="flex-1 text-sm text-ink-300 truncate">{label}</span>

      <span className="text-xs font-semibold text-red-400 flex-shrink-0">
        {pct}% correct
      </span>
    </div>
  );
}

function BarGraph({ data }) {
  const barData = {
    labels: ["0-20", "21-40", "41-60", "61-80", "81-100"],
    datasets: [
      {
        label: "Students Per Score Range",
        data: data.length > 0 ? data : [0, 0, 0, 0, 0],
        backgroundColor: colors.brand[400],
        borderWidth: 1,
      },
    ],
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        ticks: {
          stepSize: 1,
          precision: 0,
          color: colors.ink[500],
        },
        beginAtZero: true,
        grid: {
          color: "rgba(0,0,0,0.3)",
        },
      },
      x: {
        ticks: {
          color: colors.ink[500],
        },
        grid: {
          color: "rgba(0,0,0,0.3)",
        },
      },
    },
    plugins: {
      legend: {
        labels: {
          color: colors.ink[300],
        },
      },
    },
  };
  return <Bar options={options} data={barData} />;
}

// ── Main component ─────────────────────────────────────────────────────────

export default function ResultsMainPanel({
  METRICS = [],
  DIFFICULTY = [],
  SCORES = [],
}) {
  const MOCK_NEEDS_REVIEW = [...DIFFICULTY]
    .sort((a, b) => a.pct - b.pct)
    .slice(0, 3);

  return (
    <div className="flex-1 flex flex-col min-h-0 min-w-0 p-3 sm:p-4 gap-4 bg-surface-900 font-body">
      <style>{`
  @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=Inter:wght@400;500;600&display=swap');
  .font-display { font-family: 'Baloo 2', sans-serif; }
  .font-body { font-family: 'Inter', sans-serif; }

  .themed-scroll::-webkit-scrollbar {
    width: 6px;
  }
  .themed-scroll::-webkit-scrollbar-track {
    background: transparent;
  }
  .themed-scroll::-webkit-scrollbar-thumb {
    background-color: var(--surface-700);
    border-radius: 999px;
  }
  .themed-scroll::-webkit-scrollbar-thumb:hover {
    background-color: var(--brand-400);
  }
  .themed-scroll {
    scrollbar-width: thin;
    scrollbar-color: var(--surface-700) transparent;
  }
`}</style>
      {/* ── Row 1: Metric cards — wraps to 2x2 on mobile instead of squishing 4-across ── */}
      <div className="flex flex-wrap sm:flex-nowrap gap-3 h-auto sm:h-[30%]">
        {!METRICS || !Array.isArray(METRICS) || METRICS.length === 0 ? (
          <p className="text-xs text-ink-600 mt-0.5">No data yet</p>
        ) : (
          METRICS.map((m) => <MetricCard key={m.label} {...m} />)
        )}
      </div>

      {/* ── Row 2: Bottom panels — stacks on mobile/tablet, side-by-side on lg+ ── */}
      <div className="flex flex-col lg:flex-row gap-4 min-h-0 h-auto lg:h-[70%]">
        {/* Score distribution */}
        <div className="w-full h-[300px] lg:h-auto lg:flex-1 min-w-0 bg-surface-800 rounded-2xl shadow-[6px_6px_14px_rgba(0,0,0,0.4),-4px_-4px_10px_rgba(255,255,255,0.03)] flex flex-col">
          <div className="px-4 py-3 bg-surface-700 flex-shrink-0 rounded-t-2xl">
            <h2 className="text-sm font-display font-semibold text-ink-200">
              Score distribution
            </h2>
            <p className="text-xs text-ink-500 mt-0.5">
              Number of students per score range
            </p>
          </div>
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="relative w-full h-full">
              <BarGraph data={SCORES} />
            </div>
          </div>
        </div>

        {/* Right column: difficulty + needs review stacked */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          <div className="flex-1 min-h-[220px] lg:min-h-0 bg-surface-800 rounded-2xl shadow-[6px_6px_14px_rgba(0,0,0,0.4),-4px_-4px_10px_rgba(255,255,255,0.03)] flex flex-col">
            <div className="px-4 py-3 bg-surface-700 flex-shrink-0 rounded-t-2xl">
              <h2 className="text-sm font-display font-semibold text-ink-200">
                Question difficulty
              </h2>
              <p className="text-xs text-ink-500 mt-0.5">
                % of students who answered correctly
              </p>
            </div>
            {!DIFFICULTY ||
            !Array.isArray(DIFFICULTY) ||
            DIFFICULTY.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-ink-600 text-sm italic">
                No data yet
              </div>
            ) : (
              <div className="themed-scroll flex-1 overflow-y-auto p-4 flex flex-col justify-between gap-2">
                {DIFFICULTY.map((q) => (
                  <DifficultyRow key={q.id} label={q.label} pct={q.pct} />
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 min-h-[220px] lg:min-h-0 bg-surface-800 rounded-2xl shadow-[6px_6px_14px_rgba(0,0,0,0.4),-4px_-4px_10px_rgba(255,255,255,0.03)] flex flex-col">
            <div className="px-4 py-3 bg-surface-700 flex-shrink-0 rounded-t-2xl">
              <h2 className="text-sm font-display font-semibold text-ink-200">
                Questions needing review
              </h2>
              <p className="text-xs text-ink-500 mt-0.5">
                Lowest success rate — consider revisiting in class
              </p>
            </div>
            <div className="themed-scroll flex-1 overflow-y-auto p-4 flex flex-col gap-2">
              {!MOCK_NEEDS_REVIEW ||
              !Array.isArray(MOCK_NEEDS_REVIEW) ||
              MOCK_NEEDS_REVIEW.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-ink-600 text-sm italic">
                  No data yet
                </div>
              ) : (
                MOCK_NEEDS_REVIEW.map((q, i) => (
                  <ReviewRow key={i} rank={i + 1} label={q.label} pct={q.pct} />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
