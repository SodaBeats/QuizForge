import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useDeleteQuestion } from "../api/mutations.js";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { GenerationDone } from "./GenerationDone";
import { FileSection } from "./FileSection";
import { SelectQuizModal } from "./SelectQuizModal";

export function SideBar({
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
      <div className="w-full lg:w-52 bg-specialsurface flex flex-col font-body p-2 gap-2">
        {/* Logo — the topbar's logo moved here; shown at lg+ only, where the
            sidebar cuts into the topbar's row (below lg the topbar keeps it) */}
        <Link
          to="/teacher"
          className="hidden lg:flex items-center gap-2.5 shrink-0 px-1 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-md flex items-center justify-center font-display font-extrabold text-inkondark text-sm bg-accent">
            Q
          </div>
          <span className="font-display font-bold text-inkondark group-hover:text-accent transition-colors">
            Ilmari<span className="text-accent">Gen</span>
          </span>
        </Link>

        <FileSection
          uploadedFiles={uploadedFiles}
          setUploadedFiles={setUploadedFiles}
          selectedFileId={selectedFileId}
          setSelectedFileId={setSelectedFileId}
          handleFileUpload={handleFileUpload}
          isUploading={isUploading}
        />

        {/* Current Quiz - Small Section */}
        <div className="rounded-lg p-2 border border-muted/20">
          <div className="text-xs font-semibold text-inkondark mb-3 uppercase tracking-wide border-b border-muted/20">
            Current quiz
          </div>
          {currentQuiz ? (
            <div className="flex items-center justify-between w-full rounded-md px-2 py-1 group bg-accent ">
              <span className="text-xs text-inkondark font-medium truncate flex-1">
                {currentQuiz.quizTitle}
              </span>
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
        <div className="flex-1 rounded-lg p-2 overflow-y-auto border border-muted/20">
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
                  <div
                    className="cursor-pointer truncate flex-1"
                    onClick={() => setSelectedQuestionId(question.id)}
                  >
                    {question.questionText || question.question_text}
                  </div>
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
        message="Are you sure you wish to delete this question?"
        confirmLabel="Delete question"
        onConfirm={confirmQuestionDelete}
        onCancel={() => setQuestionToDelete(null)}
      />
    </>
  );
}
