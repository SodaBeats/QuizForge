// ResultsMainPanel.jsx
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

// ── Helpers ────────────────────────────────────────────────────────────────

// Bar color based on success rate
function difficultyBarClass(pct) {
  if (pct >= 70) return 'bg-green-500';
  if (pct >= 50) return 'bg-amber-500';
  return 'bg-red-500';
}

// Score text color for the pct label
function difficultyTextClass(pct) {
  if (pct >= 70) return 'text-green-400';
  if (pct >= 50) return 'text-amber-400';
  return 'text-red-400';
}

// ── Sub-components ─────────────────────────────────────────────────────────

/*function ScoreDistributionGraph(){
  const options = {};
  return <Bar options={options} data={} />;
}*/

function MetricCard({ label, value, sub, }) {
  return (
    <div className={`flex-1 min-w-0 bg-gray-800 rounded-xl p-4 flex flex-col justify-between`}>
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
        {label}
      </p>
      <div>
        <p className="text-3xl font-bold text-white leading-none mb-1">
          {value}
        </p>
        <p className="text-xs text-gray-500 truncate">{sub}</p>
      </div>
    </div>
  );
}

function DifficultyRow({ label, pct }) {
  return (
    <div className="flex items-center gap-3">
      {/* Question label — fixed width so bars all start at the same x */}
      <span className="text-xs text-gray-400 w-40 flex-shrink-0 truncate">
        {label}
      </span>

      {/* Bar track */}
      <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${difficultyBarClass(pct)}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Percentage */}
      <span className={`text-xs font-semibold w-8 text-right flex-shrink-0 ${difficultyTextClass(pct)}`}>
        {pct}%
      </span>
    </div>
  );
}

function ReviewRow({ rank, label, pct }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg border border-gray-600">
      {/* Rank badge */}
      <span className="w-6 h-6 rounded-full bg-red-900 text-red-300 text-xs font-bold flex items-center justify-center flex-shrink-0">
        {rank}
      </span>

      {/* Label */}
      <span className="flex-1 text-sm text-gray-200 truncate">{label}</span>

      {/* Success rate */}
      <span className="text-xs font-semibold text-red-400 flex-shrink-0">
        {pct}% correct
      </span>
    </div>
  );
}

function BarGraph({data}){
  const barData = {
    labels: ["0-20", "21-40", "41-60", "61-80", "81-100"],
    datasets: [{
      label: "Score Distribution",
      data: data.length>0 ? data : [0,0,0,0,0],
      backgroundColor: "#3b82f6",
      borderWidth: 1,
    }],
  };
  const options = { 
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        tickes:{
          stepSize: 1,
          precision: 0
        },
        begingAtZero: true,
      },
    },
  };
  return <Bar options={options} data={barData} />;
}

// ── Main component ─────────────────────────────────────────────────────────

export default function ResultsMainPanel({METRICS = [], DIFFICULTY = [], SCORES = []}) {

  // Questions that need review = lowest success rate questions
  const MOCK_NEEDS_REVIEW = [...DIFFICULTY]
    .sort((a, b) => a.pct - b.pct)
    .slice(0, 3);

  return (
    <div className="flex-1 flex flex-col min-h-0 min-w-0 p-4 gap-4">

      {/* ── Row 1: Metric cards (~30% height) ──────────────────────── */}
      <div className="flex gap-3" style={{ height: '30%' }}>
        {!METRICS || !Array.isArray(METRICS) || METRICS.length === 0 ? (
          <p className="text-xs text-gray-500 mt-0.5">No data yet</p>
        ) : (
          METRICS.map((m) => (
            <MetricCard key={m.label} {...m} />
          ))
        )}
      </div>

      {/* ── Row 2: Bottom panels (~70% height) ─────────────────────── */}
      <div className="flex gap-4 min-h-0" style={{ height: '70%' }}>

        {/* Left: Score distribution placeholder */}
        <div className="flex-1 min-w-0 bg-gray-800 rounded-xl border border-gray-700 flex flex-col">
          <div className="px-4 py-3 border-b border-gray-700 flex-shrink-0">
            <h2 className="text-sm font-semibold text-white">Score distribution</h2>
            <p className="text-xs text-gray-500 mt-0.5">Chart coming soon</p>
          </div>
          {/* Placeholder body */}
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="relative w-full h-full">
              <BarGraph data={SCORES} />
            </div>
          </div>
        </div>

        {/* Right column: difficulty + needs review stacked */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">

          {/* Question difficulty */}
          <div className="flex-1 min-h-0 bg-gray-800 rounded-xl border border-gray-700 flex flex-col">
            <div className="px-4 py-3 border-b border-gray-700 flex-shrink-0">
              <h2 className="text-sm font-semibold text-white">Question difficulty</h2>
              <p className="text-xs text-gray-500 mt-0.5">% of students who answered correctly</p>
            </div>
            { !DIFFICULTY || !Array.isArray(DIFFICULTY) || DIFFICULTY.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-gray-500 text-sm italic">
                No Data Yet
              </div>
              ) : (
              <div className="flex-1 overflow-y-auto p-4 flex flex-col justify-between gap-2">
                {DIFFICULTY.map((q) => (
                  <DifficultyRow key={q.id} label={q.label} pct={q.pct} />
                ))}
              </div>
              )
            }
          </div>

          {/* Questions needing review */}
          <div className="flex-1 min-h-0 bg-gray-800 rounded-xl border border-gray-700 flex flex-col">
            <div className="px-4 py-3 border-b border-gray-700 flex-shrink-0">
              <h2 className="text-sm font-semibold text-white">Questions needing review</h2>
              <p className="text-xs text-gray-500 mt-0.5">Lowest success rate — consider revisiting in class</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
              {!MOCK_NEEDS_REVIEW || !Array.isArray(MOCK_NEEDS_REVIEW) || MOCK_NEEDS_REVIEW.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-900 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <p className="text-xs text-gray-600">No questions need review at this time</p>
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