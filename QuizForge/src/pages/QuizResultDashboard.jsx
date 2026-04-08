import { useEffect, useContext, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import TopBar from '../components/TopBar';
import ResultsLeaderboard from '../components/ResultsLeaderboard';
import ResultsMainPanel from '../components/ResultsMainPanel';
import { AuthContext } from '../components/AuthProvider';

export default function QuizResultDashboard () {

  const [metrics, setMetrics] = useState([
    {label: 'Total Takers', value: 'No Data Yet', sub: 'unique students'},
    {label: 'Average Score', value: 'No Data Yet', sub: 'quiz average'},
    {label: 'Highest Score', value: 'No Data Yet', sub: 'No Data Yet'},
    {label: 'Lowest Score', value: 'No Data Yet', sub: 'quiz minimum'},
  ]);
  const [students, setStudents] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [scoreDistribution, setScoreDistribution] = useState([]);
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
  function getScoreDistribution(data){
    const buckets = [
      { label: "0-20",   min: 0,  max: 20,  count: 0 },
      { label: "21-40",  min: 21, max: 40,  count: 0 },
      { label: "41-60",  min: 41, max: 60,  count: 0 },
      { label: "61-80",  min: 61, max: 80,  count: 0 },
      { label: "81-100", min: 81, max: 100, count: 0 },
    ];
    data.forEach((student) => {
      const bucket = buckets.find(b => student.score >= b.min && student.score <= b.max);
      if (bucket) bucket.count++;
    });
    return buckets.map(b => {return b.count});
  }

  //--DATA FETCH --------------------------------------------
  useEffect(() => {
    async function fetchDashboardData(){
      try{
        //check if there are attempts first
        const existRes = await authFetch(`http://localhost:3000/api/quizzes/${quizId}/attempts`, {
          method: 'GET',
          credentials: 'include',
        });
        const attemptsExist = await existRes.json();
        if(!attemptsExist.success){
          console.log(attemptsExist.error || attemptsExist.message);
          return;
        }

        const [metricRes, studentsRes, questionsRes, scoreRes] = await Promise.all([
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
          }),
          authFetch(`http://localhost:3000/api/quizzes/${quizId}/score` , {
            method: 'GET',
            credentials: 'include'
          }),
        ]);

        const [metrics, students, questions, scores] = await Promise.all([
          metricRes.json(),
          studentsRes.json(),
          questionsRes.json(),
          scoreRes.json()
        ]);

        if(!metrics.success){
          if(metrics.message === 'Unauthorized action'){
            await logout();
            return;
          }
          toast.error('Something went wrong while fetching metrics');
          return;
        }
        setMetrics(buildMetrics(metrics));

        if(!students.success){
          if(students.message === 'Unauthorized action'){
            await logout();
            return;
          }
          toast.error('Something went wrong while fetching student ranking');
          return;
        }
        setStudents(students.data);
        
        if(!questions.success){
          if(questions.message === 'Unauthorized action'){
            await logout();
            return;
          }
          toast.error('Something went wrong while fetching questions data');
          return;
        }
        setQuestions(buildQuestionCorrectionRate(questions.data));

        if(!scores.success){
          if(scores.message === 'Unauthorized action'){
            await logout();
            return;
          }
          toast.error('Something went wrong while fetching score distribution data');
          return;
        }
        setScoreDistribution(getScoreDistribution(scores.data));

      }catch(error){
        console.error('Failed to fetch dashboard data', error);
        toast.error('Something went wrong while fetching dashboard data');
        return;
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
          SCORES={scoreDistribution}
        />
        <ResultsLeaderboard
          STUDENTS={students}
        />
      </div>
    </div>
  );
};