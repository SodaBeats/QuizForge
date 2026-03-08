
export default function StudentTimeLimit() {
  return (
    <div className="w-72 border-l border-gray-700 bg-gray-900 p-6 hidden lg:flex flex-col gap-8">
      {/* Timer Section */}
      <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700 text-center">
        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-2">Time Remaining</p>
        <div className="text-4xl font-mono font-bold text-white">
          24:59
        </div>
        {/* Visual progress ring could go here */}
      </div>

      {/* Quiz Info */}
      <div className="space-y-4">
        <div>
          <p className="text-xs text-gray-500 font-semibold mb-1">Current Score Potential</p>
          <p className="text-sm text-gray-300">100 Points</p>
        </div>
        <div className="pt-4 border-t border-gray-800">
          <p className="text-xs text-gray-500 font-semibold mb-2">Instructions</p>
          <ul className="text-xs text-gray-400 space-y-2 list-disc pl-4">
            <li>Answers are saved automatically.</li>
            <li>You can go back to change answers.</li>
            <li>The quiz auto-submits when time expires.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}