// ResultsMainPanel.jsx
//
// All data is hardcoded mock data. Replace props with real data later.

// ── Mock data ──────────────────────────────────────────────────────────────

const MOCK_DIFFICULTY = [
  { id: 1, label: 'Q1 — Cell division',          pct: 94 },
  { id: 2, label: 'Q2 — Mitosis stages',         pct: 88 },
  { id: 3, label: 'Q3 — DNA replication',        pct: 76 },
  { id: 4, label: 'Q4 — Meiosis vs mitosis',     pct: 61 },
  { id: 5, label: 'Q5 — Chromosome structure',   pct: 45 },
  { id: 6, label: 'Q6 — Genetic recombination',  pct: 38 },
];

// Questions that need review = lowest success rate questions
const MOCK_NEEDS_REVIEW = [...MOCK_DIFFICULTY]
  .sort((a, b) => a.pct - b.pct)
  .slice(0, 3);

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

// ── Main component ─────────────────────────────────────────────────────────

export default function ResultsMainPanel({MOCK_METRICS}) {
  return (
    <div className="flex-1 flex flex-col min-h-0 min-w-0 p-4 gap-4">

      {/* ── Row 1: Metric cards (~30% height) ──────────────────────── */}
      <div className="flex gap-3" style={{ height: '30%' }}>
        {MOCK_METRICS.map((m, index) => (
          <MetricCard key={index} {...m} />
        ))}
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
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center mx-auto mb-3">
                {/* Bar chart icon — pure CSS, no emoji */}
                <div className="flex items-end gap-0.5 h-5">
                  <div className="w-1.5 h-2 bg-gray-500 rounded-sm" />
                  <div className="w-1.5 h-4 bg-gray-500 rounded-sm" />
                  <div className="w-1.5 h-5 bg-gray-500 rounded-sm" />
                  <div className="w-1.5 h-3 bg-gray-500 rounded-sm" />
                  <div className="w-1.5 h-1 bg-gray-500 rounded-sm" />
                </div>
              </div>
              <p className="text-sm text-gray-500">Chart placeholder</p>
              <p className="text-xs text-gray-600 mt-1">Score distribution will render here</p>
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
            <div className="flex-1 overflow-y-auto p-4 flex flex-col justify-between gap-2">
              {MOCK_DIFFICULTY.map((q) => (
                <DifficultyRow key={q.id} label={q.label} pct={q.pct} />
              ))}
            </div>
          </div>

          {/* Questions needing review */}
          <div className="flex-1 min-h-0 bg-gray-800 rounded-xl border border-gray-700 flex flex-col">
            <div className="px-4 py-3 border-b border-gray-700 flex-shrink-0">
              <h2 className="text-sm font-semibold text-white">Questions needing review</h2>
              <p className="text-xs text-gray-500 mt-0.5">Lowest success rate — consider revisiting in class</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
              {MOCK_NEEDS_REVIEW.map((q, i) => (
                <ReviewRow key={q.id} rank={i + 1} label={q.label} pct={q.pct} />
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}