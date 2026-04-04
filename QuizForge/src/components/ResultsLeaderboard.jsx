// ResultsLeaderboard.jsx
//
// A two-panel leaderboard sidebar for the quiz results dashboard.
// Top panel: individual student rankings for this quiz.
// Bottom panel: class (section) rankings by average score.
//
// Props (all optional for now — hardcoded mock data is used by default):
//   students  — array of { id, name, score, avatar? }
//   classes   — array of { id, name, average, takers }

const MOCK_STUDENTS = [
  { id: 1, name: 'Ana Reyes',   score: 98 },
  { id: 2, name: 'Marco Lim',   score: 95 },
  { id: 3, name: 'Sara Diaz',   score: 91 },
  { id: 4, name: 'Kion Park',   score: 89 },
  { id: 5, name: 'Lena Cruz',   score: 87 },
  { id: 6, name: 'Theo Santos', score: 82 },
  { id: 7, name: 'Mia Flores',  score: 78 },
  { id: 8, name: 'Dave Tan',    score: 74 },
];

const MOCK_CLASSES = [
  { id: 1, name: 'Section A', average: 84, takers: 28 },
  { id: 2, name: 'Section B', average: 79, takers: 31 },
  { id: 3, name: 'Section C', average: 71, takers: 25 },
  { id: 4, name: 'Section D', average: 65, takers: 30 },
];

// Derives initials from a full name string — e.g. "Ana Reyes" → "AR"
function getInitials(name) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Assigns a deterministic avatar bg/text color from a small palette
// so each student always gets the same color without storing it.
const AVATAR_COLORS = [
  { bg: 'bg-blue-900',   text: 'text-blue-300'   },
  { bg: 'bg-teal-900',   text: 'text-teal-300'   },
  { bg: 'bg-purple-900', text: 'text-purple-300' },
  { bg: 'bg-amber-900',  text: 'text-amber-300'  },
  { bg: 'bg-rose-900',   text: 'text-rose-300'   },
];

function avatarColor(id) {
  return AVATAR_COLORS[id % AVATAR_COLORS.length];
}

// Medal colors for the top 3 ranks
function rankStyle(rank) {
  if (rank === 1) return 'text-amber-400 font-bold';
  if (rank === 2) return 'text-slate-400 font-bold';
  if (rank === 3) return 'text-orange-600 font-bold';
  return 'text-gray-600 font-medium';
}

// Score badge color: green if high, amber if mid, red if low
function scoreBadgeClass(score) {
  if (score >= 85) return 'bg-green-900 text-green-300';
  if (score >= 65) return 'bg-amber-900 text-amber-300';
  return 'bg-red-900 text-red-300';
}

// ── Student row ────────────────────────────────────────────────────────────

function StudentRow({ student, rank }) {
  const { bg, text } = avatarColor(student.id);

  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-gray-800 transition-colors group">

      {/* Rank number */}
      <span className={`w-5 text-center text-sm ${rankStyle(rank)}`}>
        {rank}
      </span>

      {/* Avatar circle */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold ${bg} ${text}`}>
        {getInitials(student.name)}
      </div>

      {/* Name */}
      <span className="flex-1 text-sm text-gray-200 truncate">
        {student.name}
      </span>

      {/* Score badge */}
      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${scoreBadgeClass(student.score)}`}>
        {student.score}%
      </span>
    </div>
  );
}

// ── Class row ──────────────────────────────────────────────────────────────

function ClassRow({ cls, rank, maxAverage }) {
  // Width of the progress bar is relative to the top-scoring class
  const barWidth = maxAverage > 0 ? Math.round((cls.average / maxAverage) * 100) : 0;

  return (
    <div className="py-2 px-3 rounded-lg hover:bg-gray-800 transition-colors">

      {/* Top line: rank, name, average badge */}
      <div className="flex items-center gap-3 mb-1.5">
        <span className={`w-5 text-center text-sm ${rankStyle(rank)}`}>
          {rank}
        </span>
        <span className="flex-1 text-sm text-gray-200 truncate">{cls.name}</span>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${scoreBadgeClass(cls.average)}`}>
          {cls.average}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="ml-8 flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-500"
            style={{ width: `${barWidth}%` }}
          />
        </div>
        <span className="text-xs text-gray-500 w-14 text-right">
          {cls.takers} students
        </span>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export default function ResultsLeaderboard({ STUDENTS, classes = MOCK_CLASSES }) {
  const maxAverage = classes.length > 0 ? Math.max(...classes.map((c) => c.average)) : 0;

  return (
    <div className="w-[30%] flex-shrink-0 flex flex-col h-full border-l border-gray-700 bg-gray-900">

      {/* ── Top half: Student ranking ─────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-0 border-b border-gray-700">

        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between flex-shrink-0">
          <h2 className="text-sm font-semibold text-white tracking-wide">
            Student ranking
          </h2>
          <span className="text-xs text-gray-500">{STUDENTS?.data.length ?? 0} Students</span>
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto py-2 px-1">
          {!STUDENTS || !Array.isArray(STUDENTS.data) || STUDENTS.data.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              {/* Inline SVG - No external link needed! */}
              <svg 
                className="w-16 h-16 text-gray-700 mb-4" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={1.5} 
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" 
                />
              </svg>
              <h3 className="text-gray-400 font-medium">Waiting for Students</h3>
              <p className="text-sm text-gray-600 mt-1 max-w-xs">
                Once students start the quiz, their progress and scores will appear here automatically.
              </p>
            </div>
          ) : (
            STUDENTS?.data.map((student, index) => (
              <StudentRow key={student.id} student={student} rank={index + 1} />
            ))
          )}
        </div>
      </div>

      {/* ── Bottom half: Class ranking ────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-0">

        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between flex-shrink-0">
          <h2 className="text-sm font-semibold text-white tracking-wide">
            Class ranking
          </h2>
          <span className="text-xs text-gray-500">{classes.length} sections</span>
        </div>

        {/* List — no scroll needed for a small number of classes */}
        <div className="flex-1 overflow-y-auto py-2 px-1">
          {classes.map((cls, index) => (
            <ClassRow
              key={cls.id}
              cls={cls}
              rank={index + 1}
              maxAverage={maxAverage}
            />
          ))}
        </div>
      </div>
    </div>
  );
}