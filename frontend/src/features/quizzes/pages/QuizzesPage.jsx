import { useState } from "react";
import toast from "react-hot-toast";
import { AppShell } from "../../../components/layout/AppShell";
import { QuizzesSidebar } from "../components/QuizzesSideBar";
import { QuizzesMetadata as QuizzesMetaData } from "../components/QuizzesMetadata";
import { QuestionList as QuizzesQuestionList } from "../components/QuizzesQuestionList";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { useClasses } from "../../classes/api/queries.js";
import {
  useDeleteQuiz,
  useUpdateQuestion,
  useUpdateQuiz,
} from "../api/mutations.js";
import {
  useQuizQuestions,
  useQuizzes,
} from "../api/queries.js";

export function QuizzesPage() {
  const [selectedQuizId, setSelectedQuizId] = useState(null);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [quizToDelete, setQuizToDelete] = useState(null);
  const [mobileTab, setMobileTab] = useState("list"); // mobile-only panel switcher — purely UI state, no data logic

  // ---------------------------------------------------------------------
  // QUERIES
  // ---------------------------------------------------------------------

  const {
    data: queryQuizzes,
    isFetching: queryQuizzesFetching,
    error: queryQuizzesError,
  } = useQuizzes();

  const selectedQuiz =
    queryQuizzes?.find((q) => q.id === selectedQuizId) ?? null;

  // get all questions related to quiz (same key the quiz maker writes to)
  const { data: queryQuestions, isFetching: queryQuestionsFetching } =
    useQuizQuestions(selectedQuizId, {
      enabled: !!selectedQuizId && selectedQuiz?.questionCount > 0,
    });

  // get all user classes (same key the forge-quiz modal uses)
  const {
    data: userClasses,
    isFetching: isFetchingClasses,
    error: classFetchError,
  } = useClasses();

  // ---------------------------------------------------------------------
  // MUTATIONS
  // ---------------------------------------------------------------------

  const deleteQuiz = useDeleteQuiz();
  const updateQuiz = useUpdateQuiz();
  const updateQuestion = useUpdateQuestion();

  const handleDeleteQuiz = (quizId) => {
    setQuizToDelete(
      queryQuizzes?.find((quiz) => quiz.id === quizId) ?? { id: quizId },
    );
  };

  const confirmDeleteQuiz = () => {
    if (!quizToDelete) return;

    const quizId = quizToDelete.id;
    const previousSelectedQuizId = selectedQuizId;
    if (selectedQuizId === quizId) {
      setSelectedQuizId(null);
    }

    deleteQuiz.mutate(quizId, {
      onSuccess: () => toast.success("Quiz Deleted!"),
      onError: () => setSelectedQuizId(previousSelectedQuizId),
    });

    setQuizToDelete(null);
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

  const handleQuizMetaUpdate = (quizToChange) => {
    const originalQuiz = queryQuizzes?.find(
      (quiz) => quiz.id === quizToChange.id,
    );

    if (!originalQuiz) return;

    const changes = getChanges(originalQuiz, quizToChange);

    if (Object.keys(changes).length === 0) {
      toast.error("No changes to save");
      return;
    }

    setSelectedQuizId(quizToChange.id);

    updateQuiz.mutate(quizToChange, {
      onSuccess: () => toast.success("Quiz Updated!"),
      onError: () => setSelectedQuizId(null),
    });
  };

  const handleQuestionUpdate = (quizId, editingQuestionToSave) => {
    updateQuestion.mutate(
      { quizId, question: editingQuestionToSave },
      {
        onSuccess: () => toast.success("Question Updated!"),
        onError: () => setEditingQuestion(null),
      },
    );
  };

  return (
    <AppShell
      tabs={
        selectedQuizId
          ? [
              { key: "list", label: "Quizzes" },
              { key: "details", label: "Details" },
              { key: "questions", label: "Questions" },
            ]
          : [] // no selection → no switcher (matches the old conditional strip)
      }
      activeTab={mobileTab}
      onChange={setMobileTab}
      panels={[
        {
          key: "list",
          visible: !selectedQuizId || mobileTab === "list",
          children: (
            <QuizzesSidebar
              isFetching={queryQuizzesFetching}
              isError={queryQuizzesError}
              quizzes={queryQuizzes}
              selectedQuizId={selectedQuizId}
              setSelectedQuizId={setSelectedQuizId}
              onDeleteQuiz={handleDeleteQuiz}
            />
          ),
        },
        ...(selectedQuizId
          ? [
              {
                key: "details",
                children: (
                  <QuizzesMetaData
                    key={selectedQuiz.id}
                    quiz={selectedQuiz}
                    onUpdateQuizMeta={handleQuizMetaUpdate}
                    userClasses={userClasses}
                    isFetchingClasses={isFetchingClasses}
                    classFetchError={classFetchError}
                  />
                ),
              },
              {
                key: "questions",
                children: (
                  <QuizzesQuestionList
                    isFetching={queryQuestionsFetching}
                    questions={queryQuestions?.questionList}
                    selectedQuiz={selectedQuiz}
                    onUpdateQuestion={handleQuestionUpdate}
                    editingQuestion={editingQuestion}
                    setEditingQuestion={setEditingQuestion}
                  />
                ),
              },
            ]
          : []),
      ]}
    >
      {!selectedQuizId && (
        <div className="flex-1 min-w-0 flex items-center justify-center text-ink text-sm font-body p-3">
          Select a quiz to view details
        </div>
      )}

      <ConfirmDialog
        open={Boolean(quizToDelete)}
        title="Delete quiz?"
        message="Are you sure you wish to delete this quiz?"
        confirmLabel="Delete quiz"
        onConfirm={confirmDeleteQuiz}
        onCancel={() => setQuizToDelete(null)}
      />
    </AppShell>
  );
}
