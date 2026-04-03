import { useEffect, useContext, useState } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import TopBar from '../components/TopBar';
import ResultsLeaderboard from '../components/ResultsLeaderboard';
import ResultsMainPanel from '../components/ResultsMainPanel';
import { AuthContext } from '../components/AuthProvider';


export default function QuizResultDashboard () {

  const [metrics, setMetrics] = useState(null);
  const [students, setStudents] = useState(null);
  const { authFetch } = useContext(AuthContext);
  const { quizId } = useParams();

  function buildMetrics(data) {
    return [
      { label: 'Total takers', value: data.totalTakers, sub: 'unique students'},
      { label: 'Average score', value: `${data.averageScore}%`, sub: 'class average'},
      { label: 'Highest score', value: `${data.highestScore}%`, sub: data.highestScorer},
      { label: 'Lowest score', value: `${data.lowestScore}%`, sub: 'class minimum'},
    ];
  }

  // ── Mock data ──────────────────────────────────────────────────────────────
  const MOCK_METRICS = [
    {
      label: 'Total takers',
      value: '84',
      sub: 'out of 91 enrolled',
    },
    {
      label: 'Average score',
      value: '71%',
      sub: 'class average',
    },
    {
      label: 'Highest score',
      value: '98%',
      sub: 'Ana Reyes',
    },
    {
      label: 'Lowest score',
      value: '34%',
      sub: 'class minimum',
    },
  ];

  useEffect(() => {
    async function fetchDashboardData(){
      try{
        const [metricRes, studentsRes] = await Promise.all([
          authFetch(`http://localhost:3000/api/quizzes/${quizId}/metrics`, {
            method: 'GET',
            credentials: 'include',
          }),
          authFetch(`http://localhost:3000/api/quizzes/${quizId}/students`, {
            method: 'GET',
            ceredentials: 'include'
          })
        ]);

        const [metrics, students] = await Promise.all([
          metricRes.json(),
          studentsRes.json()
        ]);

        if(!metrics.success){
          toast.error('Something went wrong while fetching metrics');
          return;
        }
        setMetrics(buildMetrics(metrics));

        if(!students.success){
          toast.error('Something went wrong while fetching metrics');
          return;
        }
        setStudents(students);

      }catch(error){
        console.error('Failed to fetch dashboard data', error);
        toast.error('Something went wrong while fetching dashboard data');
      }
    }
    fetchDashboardData();
  }, [quizId, authFetch]);

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">
      <TopBar />
      <div className="flex flex-1 min-h-0">
        {/* Main content area */}
        <ResultsMainPanel
          MOCK_METRICS = { MOCK_METRICS }
        />
        <ResultsLeaderboard />
      </div>
    </div>
  );
};