import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useClasses } from "../../classes/api/queries.js";
import { useCreateQuiz } from "../api/mutations.js";
import { QuizForgeModal } from "./QuizForgeModal";

export function ForgeQuizAction({ selectedFile, setQuizMetadata }) {
  const [isForgeQuizModalOpen, setIsForgeQuizModalOpen] = useState(false);
  const [isCreatingQuiz, setIsCreatingQuiz] = useState(false);
  const [forgeQuizData, setForgeQuizData] = useState({
    quizTitle: "",
    description: "",
    shareToken: "",
    maxAttempts: 1,
    dueDate: "",
    status: "draft",
    accessibility: "anyone",
    selectedClassIds: [],
  });

  const location = useLocation();
  const navigate = useNavigate();
  const createQuiz = useCreateQuiz();
  const showFileButton = location.pathname === "/teacher";

  const openForgeQuizModal = () => {
    const quizToken = Math.random().toString(36).substring(2, 8).toUpperCase();

    setForgeQuizData({
      quizTitle: selectedFile?.name || "",
      description: "",
      shareToken: quizToken,
      maxAttempts: 1,
      dueDate: "",
      status: "draft",
      accessibility: "anyone",
      selectedClassIds: [],
    });
    setIsForgeQuizModalOpen(true);
  };

  useEffect(() => {
    if (location.pathname !== "/teacher") {
      return;
    }

    if (location.state?.openForgeQuizModal === true) {
      openForgeQuizModal();
      navigate(location.pathname, {
        replace: true,
        state: {},
      });
    } // eslint-disable-next-line
  }, [location.pathname, location.state, navigate]);

  const closeForgeQuizModal = () => {
    setIsForgeQuizModalOpen(false);
    setForgeQuizData({
      quizTitle: "",
      description: "",
      shareToken: "",
      maxAttempts: 0,
      dueDate: "",
      status: "draft",
      accessibility: "anyone",
      selectedClassIds: [],
    });
  };

  const handleForgeQuiz = async () => {
    if (
      !forgeQuizData.dueDate ||
      !forgeQuizData.quizTitle ||
      !forgeQuizData.maxAttempts ||
      !forgeQuizData.status
    ) {
      toast.error("Please input all required fields");
      return;
    }

    const maxAttempts = Number(forgeQuizData.maxAttempts);
    if (
      typeof maxAttempts !== "number" ||
      isNaN(maxAttempts) ||
      maxAttempts <= 0
    ) {
      toast.error("Max attempts must be a valid number");
      return;
    }
    const selectedClassIds = forgeQuizData.selectedClassIds || [];
    const accessibility = selectedClassIds.length > 0 ? "restricted" : "anyone";

    setIsCreatingQuiz(true);

    try {
      const finalDueDate = new Date(forgeQuizData.dueDate).toISOString();

      const data = await createQuiz.mutateAsync({
        quizTitle: forgeQuizData.quizTitle,
        description: forgeQuizData.description,
        shareToken: forgeQuizData.shareToken,
        maxAttempts,
        dueDate: finalDueDate,
        status: forgeQuizData.status,
        accessibility,
        classIds: selectedClassIds,
      });

      setQuizMetadata(data.quiz);
      toast.success(data.message);
      closeForgeQuizModal();
    } catch (error) {
      console.error("Error creating quiz: ", error);
    } finally {
      setIsCreatingQuiz(false);
    }
  };

  const {
    data: userClasses,
    isFetching: isFetchingClasses,
    error: classFetchError,
  } = useClasses({ enabled: isForgeQuizModalOpen });

  if (!showFileButton) {
    return null;
  }

  return (
    <>
      <button
        className="btn-primary py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-600"
        onClick={openForgeQuizModal}
      >
        Forge quiz
      </button>

      {isForgeQuizModalOpen && (
        <QuizForgeModal
          forgeQuizData={forgeQuizData}
          setForgeQuizData={setForgeQuizData}
          handleForgeQuiz={handleForgeQuiz}
          isCreatingQuiz={isCreatingQuiz}
          closeForgeQuizModal={closeForgeQuizModal}
          userClasses={userClasses}
          isFetchingClasses={isFetchingClasses}
          classFetchError={classFetchError}
        />
      )}
    </>
  );
}
