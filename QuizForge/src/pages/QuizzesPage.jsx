import { useContext, useState } from "react";
import { Navigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AuthContext } from "../components/AuthProvider";
import QuizzesSidebar from "../components/QuizzesSideBar";
import TopBar from "../components/TopBar";
import QuizzesMetaData from "../components/QuizzesMetadata";
import QuizzesQuestionList from "../components/QuizzesQuestionList";

const backendHost = import.meta.env.VITE_BACKEND_HOST;

export default function QuizzesPage() {
  const { authFetch } = useContext(AuthContext);
  const [selectedQuizId, setSelectedQuizId] = useState(null);
  //const [quizzes, setQuizzes] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const queryClient = useQueryClient();

  // ---------------------------------------------------------------------
  // FUNCTIONS
  // ---------------------------------------------------------------------

  const fetchQuizzes = async () => {
    const response = await authFetch(`${backendHost}/api/quizzes`, {
      method: "GET",
      credentials: "include",
    });
    if (!response || !response.ok) {
      throw new Error(
        `Failed to fetch quizzes: ${response?.status} ${response?.statusText}`,
      );
    }
    const result = await response.json();
    if (!result.success) {
      throw new Error(
        `Failed to fetch quizzes: ${result.message || result.error}`,
      );
    }
    if (result.success) console.log(result.userQuizzes);
    return result.userQuizzes;
  };

  // FETCH QUIZZES AND STORE IN TANSTACK CACHE
  const { data: queryQuizzes, isFetching: queryQuizzesFetching } = useQuery({
    queryKey: ["queryQuizzes"],
    queryFn: fetchQuizzes,
    staleTime: 1000 * 60 * 5,
  });
  const selectedQuiz =
    queryQuizzes?.find((q) => q.id === selectedQuizId) || null;

  const handleDeleteQuiz = async (quizId) => {
    const queryKey = ["queryQuizzes"];
    const previousSelectedQuizId = selectedQuizId;
    const previousQuizzesData = queryClient.getQueryData(queryKey);

    if (previousQuizzesData) {
      queryClient.setQueryData(queryKey, (oldData) =>
        oldData.filter((q) => q.id !== quizId),
      );
    }
    if (selectedQuizId === quizId) {
      setSelectedQuizId(null);
    }
    try {
      const response = await authFetch(`${backendHost}/api/quizzes/${quizId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(
          `Server responded with: Error ${response.status}: ${response.statusText}`,
        );
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(
          `Failed to delete quiz: ${result.message || result.error}`,
        );
      }

      toast.success(result.message);
    } catch (error) {
      console.error(error.message, error.status);
      if (previousQuizzesData) {
        queryClient.setQueryData(queryKey, previousQuizzesData);
      }
      setSelectedQuizId(previousSelectedQuizId);
      alert("Something went wrong with the quiz deletion.");
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
          isFetching={queryQuizzesFetching}
          quizzes={queryQuizzes}
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
