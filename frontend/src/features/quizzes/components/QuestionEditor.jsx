import { useState, useEffect } from "react";
import { GenerationStatus } from "./GenerationStatus";
import toast from "react-hot-toast";
import { useAllDocuments } from "../../documents/api/queries.js";
import {
  useCreateQuestion,
  useGenerateQuestions,
  useUpdateQuestion,
} from "../api/mutations.js";
import { AddQuestionForm } from "./AddQuestionForm";
import { UpdateQuestionForm } from "./UpdateQuestionForm";
import { GenerateSettingsPanel } from "./GenerateSettingsPanel";

export function QuestionEditor({
  selectedQuestion,
  setSelectedQuestionId,
  quizMetadata,
  onGenerationStart,
  onGenerationComplete,
}) {
  const [addMode, setAddMode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showSourcesDropdown, setShowSourcesDropdown] = useState(false);
  const [manualQuestion, setManualQuestion] = useState({
    quizId: quizMetadata?.id,
    questionText: "",
    questionType: "multiple-choice",
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    correctAnswer: "",
    timeLimit: 60,
  });
  const [generateOptions, setGenerateOptions] = useState({
    questionType: "multiple-choice",
    timeLimit: 60,
    questionAmount: 5,
    sources: [],
    topic: "",
  });

  useEffect(() => {
    if (selectedQuestion) {
      setManualQuestion({
        id: selectedQuestion.id,
        quizId: selectedQuestion.quizId,
        questionText: selectedQuestion.questionText || "",
        questionType: selectedQuestion.questionType || "multiple-choice",
        optionA: selectedQuestion.optionA || "",
        optionB: selectedQuestion.optionB || "",
        optionC: selectedQuestion.optionC || "",
        optionD: selectedQuestion.optionD || "",
        correctAnswer: selectedQuestion.correctAnswer || "",
        timeLimit: selectedQuestion.timeLimit || 60,
      });
      setAddMode("edit");
    } else {
      setManualQuestion({
        quizId: quizMetadata?.id || null,
        questionText: "",
        questionType: "multiple-choice",
        optionA: "",
        optionB: "",
        optionC: "",
        optionD: "",
        correctAnswer: "",
        timeLimit: 60,
      });
      setAddMode(null);
    }
  }, [selectedQuestion, quizMetadata?.id]);

  const createQuestion = useCreateQuestion();
  const updateQuestion = useUpdateQuestion();
  const generateQuestions = useGenerateQuestions();

  const { data: documentsData, error: documentsError } = useAllDocuments({
    enabled: addMode === "generate",
  });
  const documents = Array.isArray(documentsData?.documents)
    ? documentsData.documents
    : [];
  const docFetchError = Boolean(documentsError);

  const handleToggleSource = (docId) => {
    setGenerateOptions((prev) => {
      const currentSources = prev.sources;
      const normalizedDocId = Number(docId);
      const isSelected = currentSources.some(
        (id) => Number(id) === normalizedDocId,
      );
      return {
        ...prev,
        sources: isSelected
          ? currentSources.filter((id) => Number(id) !== normalizedDocId)
          : [...currentSources, normalizedDocId],
      };
    });
  };

  const handleManualQuestionSubmit = async () => {
    if (!manualQuestion.questionText) {
      toast.error("Please input a question");
      return;
    }

    try {
      await createQuestion.mutateAsync(manualQuestion);
      toast.success("Question Added!");
      setSelectedQuestionId(null);
      setAddMode(null);
      setManualQuestion({
        quizId: quizMetadata?.id,
        questionText: "",
        questionType: manualQuestion.questionType,
        optionA: "",
        optionB: "",
        optionC: "",
        optionD: "",
        correctAnswer: "",
        timeLimit: 60,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleQuestionUpdateSubmit = async () => {
    try {
      await updateQuestion.mutateAsync({
        quizId: quizMetadata?.id,
        question: manualQuestion,
      });
      toast.success("Question Updated!");
    } catch (error) {
      console.error(`Question update error: ${error}`);
      setAddMode(null);
      setSelectedQuestionId(null);
    }
  };

  const handleGenerate = async () => {
    if (loading) return;
    if (
      generateOptions.questionAmount > 10 ||
      generateOptions.questionAmount < 1
    )
      return toast.error("Maximum of 10 questions per generation");
    setLoading(true);
    onGenerationStart(generateOptions.questionAmount);
    let failed = false;
    try {
      await generateQuestions.mutateAsync({
        quizId: quizMetadata.id,
        generateOptions,
      });

      toast.success("Generated questions added successfully");
    } catch (error) {
      failed = true;
      console.error(error);
    } finally {
      setLoading(false);
      onGenerationComplete(failed);
    }
  };

  const handleManualQuestionCancel = () => {
    setAddMode(null);
    setSelectedQuestionId(null);
    setManualQuestion({
      quizId: quizMetadata?.id,
      questionText: "",
      questionType: manualQuestion.questionType,
      optionA: "",
      optionB: "",
      optionC: "",
      optionD: "",
      correctAnswer: "",
      timeLimit: 60,
    });
  };

  const view = loading ? "generate" : addMode;

  return (
    <div className="flex-1 min-h-0 m-3 flex flex-col font-body rounded-lg bg-surface overflow-hidden border border-accent">
      <div className="p-3.5 bg-specialsurface flex justify-between items-center border-b border-muted/20">
        <div>
          <h2 className="text-sm font-display font-semibold text-inkondark">
            Question editor
          </h2>
          <p className="text-xs text-muted mt-0.5">
            {quizMetadata
              ? `Editing questions for: "${quizMetadata.quizTitle}"`
              : "No quiz selected"}
          </p>
        </div>
      </div>
      <GenerationStatus
        isGenerating={loading}
        amount={generateOptions.questionAmount}
        topic={generateOptions.topic}
      />
      <div className="flex-1 p-4 overflow-y-auto space-y-4 qe-scroll">
        {quizMetadata ? (
          view === "manual" ? (
            <AddQuestionForm
              question={manualQuestion}
              setQuestion={setManualQuestion}
              onSubmit={handleManualQuestionSubmit}
              onCancel={handleManualQuestionCancel}
            />
          ) : view === "edit" ? (
            <UpdateQuestionForm
              question={manualQuestion}
              setQuestion={setManualQuestion}
              onSubmit={handleQuestionUpdateSubmit}
              onCancel={handleManualQuestionCancel}
            />
          ) : view === "generate" ? (
            <GenerateSettingsPanel
              loading={loading}
              generateOptions={generateOptions}
              setGenerateOptions={setGenerateOptions}
              showSourcesDropdown={showSourcesDropdown}
              setShowSourcesDropdown={setShowSourcesDropdown}
              documents={documents}
              docFetchError={docFetchError}
              onToggleSource={handleToggleSource}
              onGenerate={handleGenerate}
              onCancel={() => setAddMode(null)}
            />
          ) : (
            <div className="space-y-3 text-sm">
              <button
                onClick={() => setAddMode("generate")}
                className="w-full rounded-lg p-4 text-left transition-all bg-darkslate hover:bg-darkslate/30 border border-muted/20"
              >
                <div className="text-base font-display font-semibold text-inkondark flex items-center gap-2">
                  Generate
                </div>
                <div className="mt-1 text-muted">
                  Use AI to generate questions for you
                </div>
              </button>

              <button
                onClick={() => setAddMode("manual")}
                className="w-full rounded-lg p-4 text-left transition-all bg-darkslate hover:bg-darkslate/30 border border-muted/20"
              >
                <div className="text-base font-display font-semibold text-inkondark">
                  Make your own
                </div>
                <div className="mt-1 text-muted">
                  Manually create a custom question
                </div>
              </button>
            </div>
          )
        ) : (
          <div className="text-inkondark text-sm">
            Select a file from the sidebar to start creating questions
          </div>
        )}
      </div>
    </div>
  );
}
