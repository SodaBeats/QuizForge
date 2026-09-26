import { useContext, useState } from "react";
import { Navigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AuthContext } from "../components/AuthProvider";
import QuizzesSidebar from "../components/QuizzesSideBar";
import TopBar from "../components/TopBar";
import QuizzesMetaData from "../components/QuizzesMetadata";
import QuizzesQuestionList from "../components/QuizzesQuestionList";
import { classServices } from "../services/classServices";

const backendHost = import.meta.env.VITE_BACKEND_HOST;

export default function QuizzesPage() {
  const { authFetch } = useContext(AuthContext);
  const [selectedQuizId, setSelectedQuizId] = useState(null);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [mobileTab, setMobileTab] = useState("list"); // mobile-only panel switcher — purely UI state, no data logic
  const queryClient = useQueryClient();

  // ---------------------------------------------------------------------
  // FUNCTIONS
  // ---------------------------------------------------------------------

  const fetchQuizzes = async () => {
    const response = await authFetch(`${backendHost}/api/quizzes`, {
      method: "GET",
      credentials: "include",
    });
    if (!response.ok) {
      const result = await response.json();
      throw new Error(
        result.errors?.map((e) => e.msg).join(", ") ||
          result?.message ||
          "failed to fetch quizzes",
      );
    }
    const result = await response.json();
    return result.userQuizzes;
  };

  const fetchQuestions = async (quizId) => {
    const response = await authFetch(
      `${backendHost}/api/quizzes/questions?quizId=${quizId}`,
    );
    if (!response || !response.ok) {
      const result = await response.json();
      throw new Error(
        result.errors?.map((e) => e.msg).join(", ") ||
          result?.message ||
          "failed to fetch questions",
      );
    }
    return await response.json();
  };

  // FETCH QUIZZES AND STORE IN TANSTACK CACHE
  const {
    data: queryQuizzes,
    isFetching: queryQuizzesFetching,
    error: queryQuizzesError,
  } = useQuery({
    queryKey: ["queryQuizzes"],
    queryFn: fetchQuizzes,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
  const selectedQuiz =
    queryQuizzes?.find((q) => q.id === selectedQuizId) ?? null;

  const handleDeleteQuiz = async (quizId) => {
    const confirmMessage = "Are you sure you wish to delete this quiz?";
    if (!window.confirm(confirmMessage)) return;
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
      if (!response || !response.ok) {
        const result = await response.json();
        throw new Error(
          result.errors?.map((e) => e.msg).join(", ") ||
            result?.message ||
            "failed to delete quiz",
        );
      }

      toast.success("Quiz Deleted!");
    } catch (error) {
      console.error(error);
      if (previousQuizzesData) {
        queryClient.setQueryData(queryKey, previousQuizzesData);
      }
      setSelectedQuizId(previousSelectedQuizId);
      alert("Something went wrong with the quiz deletion.");
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
    const queryKey = ["queryQuizzes"];

    //make copy of original quizzes list
    const originalQuizzes = queryClient.getQueryData(queryKey);

    //make copy of original quiz currently editing
    const originalQuiz = originalQuizzes.find(
      (originalQuiz) => originalQuiz.id === quizToChange.id,
    );

    const changes = getChanges(originalQuiz, quizToChange);

    if (Object.keys(changes).length === 0) {
      toast.error("No changes to save");
      return;
    }

    queryClient.setQueryData(queryKey, (prev) =>
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
      if (!response || !response.ok) {
        const result = await response.json();
        throw new Error(
          result.errors?.map((e) => e.msg).join(", ") ||
            result?.message ||
            "failed to update quiz",
        );
      }

      toast.success("Quiz Updated!");
    } catch (error) {
      toast.error("Failed to update quiz");
      console.error(error);
      queryClient.setQueryData(queryKey, originalQuizzes);
      setSelectedQuizId(null);
    }
  };

  // get all questions related to quiz
  const { data: queryQuestions, isFetching: queryQuestionsFetching } = useQuery(
    {
      queryKey: ["queryQuestions", selectedQuizId],
      queryFn: () => {
        if (!selectedQuizId) {
          throw new Error(`No quiz selected`);
        }
        return fetchQuestions(selectedQuizId);
      },
      staleTime: 1000 * 60 * 5,
      enabled: !!selectedQuizId && selectedQuiz?.questionCount > 0,
    },
  );

  // get all user classes
  const {
    data: userClasses,
    isFetching: isFetchingClasses,
    error: classFetchError,
  } = useQuery({
    queryKey: ["userClasses"],
    queryFn: () => classServices.fetchClasses(authFetch),
    staleTime: 1000 * 60 * 5,
  });

  const handleQuestionUpdate = async (quizId, editingQuestion) => {
    const queryKey = ["queryQuestions", selectedQuizId];
    const originalData = queryClient.getQueryData(queryKey);

    queryClient.setQueryData(queryKey, (prev) => ({
      ...prev,
      questionList: prev.questionList.map((q) =>
        q.id === editingQuestion.id ? editingQuestion : q,
      ),
    }));

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
      if (!response || !response.ok) {
        const result = await response.json();
        throw new Error(
          result.errors?.map((e) => e.msg).join(", ") ||
            result?.message ||
            "failed to update question",
        );
      }
      toast.success("Question Updated!");
    } catch (error) {
      queryClient.setQueryData(queryKey, originalData);
      console.error("Question update error: ", error);
      toast.error("Something went wrong while updating question");
      setEditingQuestion(null);
    }
  };

  if (!backendHost) {
    return <Navigate to="/error" replace />;
  }

  return (
    <div className="h-screen flex flex-col bg-[#26211c] text-[#e8ddce]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=Inter:wght@400;500;600&display=swap');
        .font-display { font-family: 'Baloo 2', sans-serif; }
        .font-body { font-family: 'Inter', sans-serif; }
      `}</style>

      {/*Top Bar */}
      <TopBar />

      {/* Mobile/tablet panel switcher — only relevant once a quiz is selected, hidden on desktop */}
      {selectedQuizId && (
        <div className="flex lg:hidden mx-3 mt-3 rounded-2xl bg-[#322b23] shadow-[6px_6px_14px_rgba(0,0,0,0.4),-4px_-4px_10px_rgba(255,255,255,0.03)] font-body overflow-hidden">
          {[
            { key: "list", label: "Quizzes" },
            { key: "details", label: "Details" },
            { key: "questions", label: "Questions" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setMobileTab(tab.key)}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors relative ${
                mobileTab === tab.key
                  ? "text-[#ff9450]"
                  : "text-[#766a59] hover:text-[#cabaa2]"
              }`}
            >
              {tab.label}
              {mobileTab === tab.key && (
                <span className="absolute left-0 bottom-0 w-full h-[2px] bg-[#ff9450]" />
              )}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Main Content Area */}

        <div
          className={`${
            !selectedQuizId || mobileTab === "list" ? "flex" : "hidden"
          } lg:contents`}
        >
          <QuizzesSidebar
            isFetching={queryQuizzesFetching}
            isError={queryQuizzesError}
            quizzes={queryQuizzes}
            selectedQuizId={selectedQuizId}
            setSelectedQuizId={setSelectedQuizId}
            onDeleteQuiz={handleDeleteQuiz}
          />
        </div>
        {selectedQuizId ? (
          <>
            <div
              className={`${
                mobileTab === "details" ? "flex" : "hidden"
              } lg:contents`}
            >
              <QuizzesMetaData
                key={selectedQuiz.id}
                quiz={selectedQuiz}
                onUpdateQuizMeta={handleQuizMetaUpdate}
                userClasses={userClasses}
                isFetchingClasses={isFetchingClasses}
                classFetchError={classFetchError}
              />
            </div>
            <div
              className={`${
                mobileTab === "questions" ? "flex" : "hidden"
              } lg:contents`}
            >
              <QuizzesQuestionList
                isFetching={queryQuestionsFetching}
                questions={queryQuestions?.questionList}
                selectedQuiz={selectedQuiz}
                onUpdateQuestion={handleQuestionUpdate}
                editingQuestion={editingQuestion}
                setEditingQuestion={setEditingQuestion}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-[#6b5f52] text-sm font-body p-3">
            Select a quiz to view details
          </div>
        )}
      </div>
    </div>
  );
}
