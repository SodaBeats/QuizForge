
import TopBar from '../components/TopBar';
import ResultsLeaderboard from '../components/ResultsLeaderboard';
import ResultsMainPanel from '../components/ResultsMainPanel';


export default function QuizResultDashboard () {

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">

      <TopBar />
      <div className="flex flex-1 min-h-0">
        {/* Main content area */}
        <ResultsMainPanel />
        <ResultsLeaderboard />
      </div>
    </div>
  );
};