import { useState } from "react";
import toast from "react-hot-toast";
import { useDeleteQuestion } from "../api/mutations.js";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { ScrollingText } from "../../../components/ui/ScrollingText";
import { GenerationDone } from "./GenerationDone";
import { FileSection } from "./FileSection";
import { SelectQuizModal } from "./SelectQuizModal";

// Renamed from SideBar: it sits inside the main content area (right of the
// section nav) now, so it's the exam workstation's panel, not a page sidebar.
// The lg+ logo it used to hold moved back to TeacherTopbar when QuizMakerPage
// adopted AppShell.
export function WorkstationPanel({
  uploadedFiles,
  setUploadedFiles,
  selectedFileId,
  setSelectedFileId,
  selectedQuestionId,
  setSelectedQuestionId,
  questions,
  questionsError,
  currentQuiz,
  setCurrentQuiz,
  isFetching,
  handleFileUpload,
  isUploading,
  isGenerating = false, // new: true while questions are being generated
  generationFailed = false, // new: true if the generation request errored
  generationAmount = 5, // new: how many questions were requested
}) {
  const [isSelectQuizModalOpen, setIsSelectQuizModalOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [questionToDelete, setQuestionToDelete] = useState(null);
  const deleteQuestion = useDeleteQuestion();

  const openSelectQuizModal = async () => {
    setIsSelectQuizModalOpen(true);
  };

  const fetchMoreQuizzes = () => {
    setPage(page + 1);
  };

  const fetchPreviousQuizzes = () => {
    if (page > 0) {
      setPage(page - 1);
    }
  };

  const handleQuestionDelete = (questionId) => {
    if (!currentQuiz?.id) return;
    setQuestionToDelete(questionId);
  };

  const confirmQuestionDelete = () => {
    if (!questionToDelete || !currentQuiz?.id) return;

    const previousSelectedQuestionId = selectedQuestionId;

    if (questionToDelete === selectedQuestionId) {
      setSelectedQuestionId(null);
    }

    deleteQuestion.mutate(
      { quizId: currentQuiz.id, questionId: questionToDelete },
      {
        onSuccess: (result) =>
          toast.success(result?.message || "Question deleted"),
        onError: () => setSelectedQuestionId(previousSelectedQuestionId),
      },
    );

    setQuestionToDelete(null);
  };

  const closeSelectQuizModal = () => {
    setIsSelectQuizModalOpen(false);
  };

  const handleSelectQuiz = async (quiz) => {
    setCurrentQuiz(quiz);
    closeSelectQuizModal();
  };

  // ------------------------------------------------------------------------------------
  // MAIN COMPONENT
  //-------------------------------------------------------------------------------------

  return (
    <>
      {/* lg sizing mirrors the old page-frame wrapper (flex-none w-52
          min-h-0) — AppShell's panel wrapper is `lg:contents`, so the panel
          itself is the flex child now. */}
      <div className="w-full lg:w-52 lg:flex-none lg:min-h-0 flex flex-col font-body p-2 gap-2">
        <FileSection
          uploadedFiles={uploadedFiles}
          setUploadedFiles={setUploadedFiles}
          selectedFileId={selectedFileId}
          setSelectedFileId={setSelectedFileId}
          handleFileUpload={handleFileUpload}
          isUploading={isUploading}
        />

        {/* Current Quiz - Small Section */}
        <div className="rounded-lg p-2 bg-specialsurface border border-muted/20">
          <div className="text-xs font-semibold text-inkondark mb-3 uppercase tracking-wide border-b border-muted/20">
            Current quiz
          </div>
          {currentQuiz ? (
            <div className="flex items-center justify-between w-full min-w-0 rounded-md px-2 py-1 group bg-accent ">
              <ScrollingText
                text={currentQuiz.quizTitle}
                className="text-xs text-inkondark font-medium flex-1 min-w-0"
              />
              <button
                onClick={() => {
                  setCurrentQuiz(null);
                }}
                className="ml-2 text-inkondark hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 text-lg leading-none"
              >
                ×
              </button>
            </div>
          ) : (
            <button
              onClick={openSelectQuizModal}
              className="text-xs text-accent hover:text-accent underline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Select a quiz
            </button>
          )}
        </div>

        {/* Green flash after questions finish generating */}
        <GenerationDone
          isGenerating={isGenerating}
          failed={generationFailed}
          amount={generationAmount}
          className="shrink-0"
        />

        {/* Question List - 70% */}
        <div className="flex-1 rounded-lg p-2 overflow-y-auto bg-specialsurface border border-muted/20">
          <div className="flex flex-row items-center justify-between mb-2 border-b border-muted/20">
            <div className="mb-3 text-xs font-semibold text-inkondark uppercase tracking-wide">
              Questions
            </div>
          </div>
          <div className="space-y-1.5">
            {Array.isArray(questions) && questions.length > 0 ? (
              questions.map((question) => (
                <div
                  key={question.id}
                  className={`py-0.5 px-2 rounded-md text-sm flex items-center justify-between group transition-all ${
                    selectedQuestionId === question.id
                      ? "bg-accent text-inkondark font-medium"
                      : "hover:bg-muted/20 text-inkondark border border-muted/20"
                  }`}
                >
                  <ScrollingText
                    text={question.questionText || question.question_text}
                    className="cursor-pointer flex-1 min-w-0"
                    onClick={() => setSelectedQuestionId(question.id)}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuestionDelete(question.id);
                    }}
                    className={`ml-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ${
                      selectedQuestionId === question.id
                        ? "text-inkondark hover:text-red-500"
                        : "text-red-400 hover:text-red-500"
                    }`}
                  >
                    ✕
                  </button>
                </div>
              ))
            ) : isFetching ? (
              <div className="space-y-1">
                <div className="text-muted text-sm">Fetching...</div>
              </div>
            ) : questionsError ? (
              <div className="space-y-1">
                <div className="text-red-400 text-sm">
                  Failed to load questions
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="text-muted text-sm">No questions</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Select Quiz Modal */}
      {isSelectQuizModalOpen && (
        <SelectQuizModal
          page={page}
          closeSelectQuizModal={closeSelectQuizModal}
          handleSelectQuiz={handleSelectQuiz}
          fetchPreviousQuizzes={fetchPreviousQuizzes}
          fetchMoreQuizzes={fetchMoreQuizzes}
        />
      )}

      <ConfirmDialog
        open={questionToDelete !== null}
        title="Delete question?"
        disclaimer="This action cannot be undone. Proceed?"
        confirmLabel="Delete question"
        onConfirm={confirmQuestionDelete}
        onCancel={() => setQuestionToDelete(null)}
      />
    </>
  );
}
