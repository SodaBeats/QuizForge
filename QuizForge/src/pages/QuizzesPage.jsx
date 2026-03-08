
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
  
  const selectedQuiz = quizzes.find(q => q.id === selectedQuizId);

  //get quizzes related to user
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

  //get all questions related to quiz
  const handleSelectedQuiz = async(chosenQuizId)=>{
    try{
      const response = await authFetch(`http://localhost:3000/api/quizzes/questions?quizId=${chosenQuizId}`)
      const result = await response.json();

      if(!result.success){
        alert(`Something went wrong: ${result.message}`);
        return;
      }

      setQuestions(result.questionList);
    }catch(error){
      console.error(error);
      alert(`something went wrong while fetching questions`);
    }
  };

  const handleQuestionUpdate = async(quizId, editingQuestion) => {
    const originalQuestions = [...questions];
    setQuestions((prev)=> prev.map((q)=> q.id === editingQuestion.id ? editingQuestion : q));

    try{
      const response = await authFetch(`http://localhost:3000/api/quizzes/${quizId}/question/${editingQuestion.id}`,{
        method: 'PATCH',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(editingQuestion),
        credentials: 'include'
      });
      const result = await response.json();

      if(!response.ok){
        alert('Something went wrong. try again later');
        console.error(result.message);
        setQuestions(originalQuestions);
      }

    }catch(error){
      setQuestions(originalQuestions);
      alert(`Network error`);
      console.error('Network error: ',error);
    }
  };

  const getChanges = (original, draft) => {
    const changes = {};
    for (const key in draft) {
      if (draft[key] !== original[key]) {
        changes[key] = draft[key];
      }
    }
    return changes;
  };

  const handleQuizMetaUpdate = async(quizToChange) => {

    const originalQuizzes = {...quizzes};
    const originalQuiz = quizzes.find((quiz) => quiz.id === quizToChange.id);

    const changes = getChanges(originalQuiz, quizToChange);
    console.log(changes);

    if(Object.keys(changes).length === 0){
      console.log('No changes to save');
      return;
    }

    setQuizzes((prev) => prev.map((q) => q.id === quizToChange.id ? quizToChange : q));
    setSelectedQuizId(quizToChange.id);

    try{
      const response = await authFetch(`http://localhost:3000/api/quizzes/${quizToChange.id}`, {
        method: 'PATCH',
        headers: {'Content-type':'application/json'},
        body: JSON.stringify(quizToChange),
        credentials: 'include'
      })

      const result = await response.json();

      if(!result.success){
        alert('Something went wrong while editing quiz information');
        console.error(result.message);
        setQuizzes(originalQuizzes);
      }

    }catch(error){
      alert('Error editing quiz information');
      console.error('Error: ', error);
      setQuizzes(originalQuizzes);
    }
  };


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
              key={selectedQuiz.id}
              quiz={selectedQuiz}
              onUpdateQuizMeta={handleQuizMetaUpdate}
            />
            <QuizzesQuestionList 
              questions={questions}
              selectedQuiz={selectedQuiz}
              onUpdateQuestion={handleQuestionUpdate}
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