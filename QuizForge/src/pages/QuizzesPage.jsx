
import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../components/AuthProvider';
import QuizzesSidebar from '../components/QuizzesSideBar';
import TopBar from '../components/TopBar';
import QuizzesMetaData from '../components/QuizzesMetadata';
import QuizzesQuestionList from '../components/QuizzesQuestionList';

export default function QuizzesPage (){

  const { authFetch } = useContext(AuthContext);
  const [selectedQuizId, setSelectedQuizId] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [questions, setQuestions] = useState([]);

  // Mock questions data
  const mockQuestions = [
    { id: 1, text: 'What is 2 + 2?' },
    { id: 2, text: 'What is the capital of France?' },
    { id: 3, text: 'Who wrote Romeo and Juliet?' },
  ];
  
  const selectedQuiz = quizzes.find(q => q.id === selectedQuizId);

  useEffect(()=>{
    authFetch(`http://localhost:3000/api/quizzes`)
    .then(res => res.json())
    .then(data => setQuizzes(data));
  },[authFetch]);

  const handleDeleteQuiz = (quizId) => {
    setQuizzes(quizzes.filter(q => q.id !== quizId));
    if (selectedQuizId === quizId) {
      setSelectedQuizId(null);
    }
  };

  const handleSelectedQuiz = async(chosenQuizId)=>{
    try{
      const response = await authFetch(`http://localhost:3000/api/quizzes/${chosenQuizId}/questions`)
      const result = await response.json();

      if(!result.success){
        alert(`Something went wrong: ${result.message}`);
        return;
      }

      setQuestions(result.questionList);
      console.log(questions);
      console.log(chosenQuizId);
    }catch(error){
      console.error(error);
      alert(`something went wrong while fetching questions`);
    }
  }


  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">
      {/*Top Bar */}
      <TopBar />

      <div className="flex-1 flex overflow-hidden">

        {/* Main Content Area */}

        <QuizzesSidebar 
          quizzes = {quizzes}
          selectedQuizId={selectedQuizId}
          setSelectedQuizId={setSelectedQuizId}
          onDeleteQuiz={handleDeleteQuiz}
          onSelectQuiz={handleSelectedQuiz}
        />
        {selectedQuizId ? (
          <>
            <QuizzesMetaData 
              quiz={selectedQuiz}
            />
            <QuizzesQuestionList 
              questions={questions}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a quiz to view details
          </div>
        )}

      </div>
    </div>
  );
}