import { useState } from "react";
import toast from "react-hot-toast";
import { useLocation } from "react-router-dom";
import { AppShell } from "../../../components/layout/AppShell";
import { SidebarNav } from "../../../components/layout/SidebarNav";
import { TEACHER_NAV_ITEMS } from "../../../components/layout/teacherNavItems";
import { QuizzesList } from "../components/QuizzesList";
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
  usePagedQuizzes,
  useQuizQuestions,
  useQuizzes,
} from "../api/queries.js";

export function QuizzesPage() {
  const location = useLocation();
  const [selectedQuizId, setSelectedQuizId] = useState(() => {
    const routeQuizId = Number(location.state?.selectedQuizId);
    return Number.isInteger(routeQuizId) && routeQuizId > 0
      ? routeQuizId
      : null;
  });
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [quizToDelete, setQuizToDelete] = useState(null);
  const [mobileTab, setMobileTab] = useState("list"); // mobile-only panel switcher — purely UI state, no data logic

  // ---------------------------------------------------------------------
  // QUERIES
  // ---------------------------------------------------------------------

  const { data: queryQuizzes } = useQuizzes();

  // Sidebar page state — the sidebar renders the paged list; queryQuizzes
  // stays for selection/delete/meta lookups (it can hold off-page quizzes).
  const [page, setPage] = useState(0);
  const {
    data: pagedQuizzes,
    isFetching: pagedQuizzesFetching,
    error: pagedQuizzesError,
  } = usePagedQuizzes(page);

  // Fall back to the paged cache: the sidebar can select quizzes beyond
  // queryQuizzes' 20-item cap (server-side pages reach every quiz).
  const selectedQuiz =
    queryQuizzes?.find((q) => q.id === selectedQuizId) ??
    pagedQuizzes?.userQuizzes?.find((q) => q.id === selectedQuizId) ??
    null;

  const attemptsExist = (selectedQuiz?.attemptCount ?? 0) > 0;

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
    const originalQuiz =
      queryQuizzes?.find((quiz) => quiz.id === quizToChange.id) ??
      pagedQuizzes?.userQuizzes?.find((quiz) => quiz.id === quizToChange.id);

    if (!originalQuiz) return;

    const changes = getChanges(originalQuiz, quizToChange);

    if (Object.keys(changes).length === 0) {
      toast.error("No changes to save");
      return;
    }

    setSelectedQuizId(quizToChange.id);

    const payload =
      (originalQuiz.attemptCount ?? 0) > 0
        ? { id: quizToChange.id, status: quizToChange.status }
        : quizToChange;

    updateQuiz.mutate(payload, {
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
      nav={<SidebarNav items={TEACHER_NAV_ITEMS} collapsed />}
      tabs={
        selectedQuiz
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
          visible: !selectedQuiz || mobileTab === "list",
          children: (
            <QuizzesList
              isFetching={pagedQuizzesFetching}
              isError={pagedQuizzesError}
              quizzes={pagedQuizzes?.userQuizzes}
              totalQuizzes={pagedQuizzes?.totalQuizzes}
              page={page}
              onPrevPage={() => setPage((p) => Math.max(0, p - 1))}
              onNextPage={() => setPage((p) => p + 1)}
              selectedQuizId={selectedQuizId}
              setSelectedQuizId={setSelectedQuizId}
              onDeleteQuiz={handleDeleteQuiz}
            />
          ),
        },
        ...(selectedQuiz
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
                    attemptsExist={attemptsExist}
                  />
                ),
              },
              {
                key: "questions",
                children: (
                  <QuizzesQuestionList
                    key={selectedQuiz.id}
                    isFetching={queryQuestionsFetching}
                    questions={queryQuestions?.questionList}
                    selectedQuiz={selectedQuiz}
                    onUpdateQuestion={handleQuestionUpdate}
                    editingQuestion={editingQuestion}
                    setEditingQuestion={setEditingQuestion}
                    attemptsExist={attemptsExist}
                  />
                ),
              },
            ]
          : []),
      ]}
    >
      {!selectedQuiz && (
        <div className="flex-1 min-w-0 flex items-center justify-center text-ink text-sm font-body ml-0 mr-3 p-3">
          Select a quiz to view details
        </div>
      )}

      <ConfirmDialog
        open={Boolean(quizToDelete)}
        title="Delete quiz?"
        message="Deleting this exam will also delete all of its attempts."
        disclaimer="This action cannt be undone. Proceed?"
        confirmLabel="Delete quiz"
        onConfirm={confirmDeleteQuiz}
        onCancel={() => setQuizToDelete(null)}
      />
    </AppShell>
  );
}
