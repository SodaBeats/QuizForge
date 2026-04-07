import { useEffect, useContext, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import TopBar from '../components/TopBar';
import ResultsLeaderboard from '../components/ResultsLeaderboard';
import ResultsMainPanel from '../components/ResultsMainPanel';
import { AuthContext } from '../components/AuthProvider';

export default function QuizResultDashboard () {

  const [metrics, setMetrics] = useState([
    {label: 'Total Takers', value: 'No data yet', sub: 'unique students'},
    {label: 'Average Score', value: 'No data yet', sub: 'quiz average'},
    {label: 'Highest Score', value: 'No data yet', sub: 'No data yet'},
    {label: 'Lowest Score', value: 'No data yet', sub: 'quiz minimum'},
  ]);
  const [students, setStudents] = useState([]);
  const [questions, setQuestions] = useState([]);
  const { authFetch, logout } = useContext(AuthContext);
  const { quizId } = useParams();
  const navigate = useNavigate();

  //--HELPER FUNCTIONS -------------------------------------
  function buildMetrics(data) {
    return [
      { label: 'Total takers', value: data.totalTakers > 0 ? data.totalTakers : 'No Data', sub: 'unique students'},
      { label: 'Average score', value: data.quizAverage > 0 ? `${data.quizAverage}%` : 'No Data', sub: 'quiz average'},
      { label: 'Highest score', value: data.highestScore > 0 ? `${data.highestScore}%` : 'No Data', sub: data.highestScorer},
      { label: 'Lowest score', value: `${data.lowestScore}%`, sub: 'quiz minimum'},
    ];
  };
  function buildQuestionCorrectionRate(data){
    return data.map((q)=> {
      return {
        id: q.questionId,
        label: q.questionText,
        pct: q.successRate,
      }
    });
  }

  //--DATA FETCH --------------------------------------------
  useEffect(() => {
    async function fetchDashboardData(){
      try{
        const [metricRes, studentsRes, questionsRes] = await Promise.all([
          authFetch(`http://localhost:3000/api/quizzes/${quizId}/metrics`, {
            method: 'GET',
            credentials: 'include',
          }),
          authFetch(`http://localhost:3000/api/quizzes/${quizId}/students`, {
            method: 'GET',
            credentials: 'include'
          }),
          authFetch(`http://localhost:3000/api/quizzes/${quizId}/questions`, {
            method: 'GET',
            credentials: 'include'
          })
        ]);

        const [metrics, students, questions] = await Promise.all([
          metricRes.json(),
          studentsRes.json(),
          questionsRes.json(),
        ]);

        if(!metrics.success){
          if(metrics.message === 'Unauthorized action'){
            logout();
          }
          toast.error('Something went wrong while fetching metrics');
          return;
        }
        setMetrics(buildMetrics(metrics));

        if(!students.success){
          if(students.message === 'Unauthorized action'){
            logout();
          }
          toast.error('Something went wrong while fetching student ranking');
          return;
        }
        setStudents(students.data);
        
        if(!questions.success){
          if(questions.message === 'Unauthorized action'){
            logout();
          }
          toast.error('Something went wrong while fetching questions data');
          return;
        }
        setQuestions(buildQuestionCorrectionRate(questions.data));

        console.log(students);
        console.log(questions);

      }catch(error){
        console.error('Failed to fetch dashboard data', error);
        toast.error('Something went wrong while fetching dashboard data');
      }
    }
    fetchDashboardData();
  }, [quizId, authFetch, navigate, logout]);

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">
      <TopBar />
      <div className="flex flex-1 min-h-0">
        {/* Main content area */}
        <ResultsMainPanel
          METRICS={metrics}
          DIFFICULTY={questions}
        />
        <ResultsLeaderboard
          STUDENTS={students}
        />
      </div>
    </div>
  );
};