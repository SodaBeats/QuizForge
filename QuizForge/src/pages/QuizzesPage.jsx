import { useContext, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import toast from "react-hot-toast";
import { AuthContext } from "../components/AuthProvider";
import QuizzesSidebar from "../components/QuizzesSideBar";
import TopBar from "../components/TopBar";
import QuizzesMetaData from "../components/QuizzesMetadata";
import QuizzesQuestionList from "../components/QuizzesQuestionList";

const backendHost = import.meta.env.VITE_BACKEND_HOST;

export default function QuizzesPage() {
  const { authFetch } = useContext(AuthContext);
  const [selectedQuizId, setSelectedQuizId] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [editingQuestion, setEditingQuestion] = useState(null);

  const selectedQuiz = quizzes.find((q) => q.id === selectedQuizId);

  //get quizzes related to user on page load
  useEffect(() => {
    if (!backendHost) return;
    authFetch(`${backendHost}/api/quizzes`)
      .then((res) => res.json())
      .then((data) =>
        setQuizzes(Array.isArray(data.userQuizzes) ? data.userQuizzes : []),
      )
      .catch((error) => {
        console.error("Failed to fetch quizzes", error);
        toast.error("Failed to load quizzes");
      });
  }, [authFetch]);

  const handleDeleteQuiz = (quizId) => {
    setQuizzes(quizzes.filter((q) => q.id !== quizId));
    if (selectedQuizId === quizId) {
      setSelectedQuizId(null);
    }
  };

  //get all questions related to quiz
  const handleSelectedQuiz = async (chosenQuizId) => {
    try {
      const response = await authFetch(
        `${backendHost}/api/quizzes/questions?quizId=${chosenQuizId}`,
      );
      const result = await response.json();

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      setQuestions(result.questionList);
    } catch (error) {
      console.error(error);
      alert(`something went wrong while fetching questions`);
    }
  };

  const handleQuestionUpdate = async (quizId, editingQuestion) => {
    const originalQuestions = [...questions];
    setQuestions((prev) =>
      prev.map((q) => (q.id === editingQuestion.id ? editingQuestion : q)),
    );

    try {
      const response = await authFetch(
        `${backendHost}/api/quizzes/${quizId}/question/${editingQuestion.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editingQuestion),
          credentials: "include",
        },
      );
      const result = await response.json();

      if (!result.success) {
        toast.error(
          result.message ||
            result.errors?.map((e) => e.msg).join(", ") ||
            "Update Failed",
        );
        console.error(result.message);
        setQuestions(originalQuestions);
      }

      setEditingQuestion(null);
    } catch (error) {
      setQuestions(originalQuestions);
      alert(`Network error`);
      console.error("Network error: ", error);
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

  const handleQuizMetaUpdate = async (quizToChange) => {
    //make copy of original quizzes list
    const originalQuizzes = [...quizzes];

    //make copy of original quiz currently editing
    const originalQuiz = originalQuizzes.find(
      (originalQuiz) => originalQuiz.id === quizToChange.id,
    );

    const changes = getChanges(originalQuiz, quizToChange);

    if (Object.keys(changes).length === 0) {
      toast.error("No changes to save");
      return;
    }

    setQuizzes((prev) =>
      prev.map((q) => (q.id === quizToChange.id ? quizToChange : q)),
    );
    setSelectedQuizId(quizToChange.id);

    try {
      const response = await authFetch(
        `${backendHost}/api/quizzes/${quizToChange.id}`,
        {
          method: "PATCH",
          headers: { "Content-type": "application/json" },
          body: JSON.stringify(quizToChange),
          credentials: "include",
        },
      );

      const result = await response.json();

      if (!result.success) {
        toast.error(
          result.message ||
            result.errors?.map((e) => e.msg).join(", ") ||
            "Update Failed",
        );
        setQuizzes(originalQuizzes);
        return;
      }

      toast.success("Quiz Updated!");
    } catch (error) {
      alert("Error editing quiz information");
      console.error("Error: ", error);
      setQuizzes(originalQuizzes);
    }
  };

  if (!backendHost) {
    return <Navigate to="/error" replace />;
  }

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">
      {/*Top Bar */}
      <TopBar />

      <div className="flex-1 flex overflow-hidden">
        {/* Main Content Area */}

        <QuizzesSidebar
          quizzes={quizzes}
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
              editingQuestion={editingQuestion}
              setEditingQuestion={setEditingQuestion}
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
