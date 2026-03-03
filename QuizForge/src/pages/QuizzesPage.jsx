
import { useState } from 'react';
import QuizzesSidebar from '../components/QuizzesSideBar';
import TopBar from '../components/TopBar';
import QuizzesMetaData from '../components/QuizzesMetadata';
import QuizzesQuestionList from '../components/QuizzesQuestionList';

export default function QuizzesPage (){

  const [selectedQuizId, setSelectedQuizId] = useState(null);
  const [quizzes, setQuizzes] = useState([
    { 
      id: 1, 
      title: 'Math Quiz', 
      questionCount: 10,
      description: 'Basic algebra and geometry questions',
      shareToken: 'ABC123',
      timeLimit: 30,
      dueDate: '2026-03-10T23:59',
      status: 'active'
    },
    { 
      id: 2, 
      title: 'Science Quiz', 
      questionCount: 15,
      description: 'Physics and chemistry fundamentals',
      shareToken: 'XYZ789',
      timeLimit: 45,
      status: 'active'
    },
    { 
      id: 3, 
      title: 'History Quiz', 
      questionCount: 8,
      status: 'draft'
    },
  ]);

  // Mock questions data
  const mockQuestions = [
    { id: 1, text: 'What is 2 + 2?' },
    { id: 2, text: 'What is the capital of France?' },
    { id: 3, text: 'Who wrote Romeo and Juliet?' },
  ];
  
  const selectedQuiz = quizzes.find(q => q.id === selectedQuizId);

  const handleDeleteQuiz = (quizId) => {
    setQuizzes(quizzes.filter(q => q.id !== quizId));
    if (selectedQuizId === quizId) {
      setSelectedQuizId(null);
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
          onSelectQuiz={setSelectedQuizId}
          onDeleteQuiz={handleDeleteQuiz}
        />
        {selectedQuizId ? (
          <>
            <QuizzesMetaData quiz={selectedQuiz} />
            <QuizzesQuestionList questions={mockQuestions} />
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