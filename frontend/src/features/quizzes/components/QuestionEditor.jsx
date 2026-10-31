import { useState, useEffect } from "react";
import { GenerationStatus } from "./GenerationStatus";
import toast from "react-hot-toast";
import { useAllDocuments } from "../../documents/api/queries.js";
import {
  useCreateQuestion,
  useGenerateQuestions,
  useUpdateQuestion,
} from "../api/mutations.js";

// shared styling tokens — cosmetic only, referenced by className below
const inputClass =
  "w-full bg-darkslate rounded-md px-3 py-2 text-sm text-inkondark placeholder:text-muted border border-muted/30 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 transition font-body";
const labelClass = "block text-sm font-medium mb-1.5 text-inkondark font-body";

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
    //question usestate
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

  // CHANGE EDITOR VALUES BASED ON SELECTED QUESTION ------------------------
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

  // USER DOCUMENTS FOR CONTEXT SOURCES (loaded when the generate form opens)
  const { data: documentsData, error: documentsError } = useAllDocuments({
    enabled: addMode === "generate",
  });
  const documents = Array.isArray(documentsData?.documents)
    ? documentsData.documents
    : [];
  const docFetchError = Boolean(documentsError);

  // TOGGLE DOCUMENT SELECTION FOR SOURCES ------------------------------------
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

  // changes question editor depending on which mode you select ----------------
  const handleModeSelect = (mode) => {
    setAddMode(mode);
  };

  // SUBMIT MANUALLY MADE QUESTION --------------------------------------------
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

  // SUBMIT QUESTION UPDATE ------------------------------------------------------
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

  // SUBMIT MANUALLY MADE QUESTION ----------------------------------------------
  const handleManualSubmit = async () => {
    if (addMode === "edit") {
      await handleQuestionUpdateSubmit();
    } else {
      await handleManualQuestionSubmit();
    }
  };

  // GENERATE QUESTIONS BY AI ------------------------------------------------
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

  // while generating, always show the (locked) generate form
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
          view === "manual" || view === "edit" ? (
            <>
              <div>
                <label className={labelClass}>Question type</label>
                <select
                  value={manualQuestion.questionType}
                  onChange={(e) =>
                    setManualQuestion({
                      ...manualQuestion,
                      questionType: e.target.value,
                    })
                  }
                  className={inputClass}
                >
                  <option value="multiple-choice">Multiple choice</option>
                  <option value="true-false">True/False</option>
                  <option value="short-answer">Short answer</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Question text</label>
                <textarea
                  value={manualQuestion.questionText}
                  onChange={(e) =>
                    setManualQuestion({
                      ...manualQuestion,
                      questionText: e.target.value,
                    })
                  }
                  className={`${inputClass} h-24 resize-none`}
                  placeholder="Enter question..."
                />
              </div>
              {manualQuestion.questionType === "multiple-choice" && (
                <>
                  <div>
                    <label className={labelClass}>Option A</label>
                    <input
                      type="text"
                      value={manualQuestion.optionA}
                      onChange={(e) =>
                        setManualQuestion({
                          ...manualQuestion,
                          optionA: e.target.value,
                        })
                      }
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Option B</label>
                    <input
                      type="text"
                      value={manualQuestion.optionB}
                      onChange={(e) =>
                        setManualQuestion({
                          ...manualQuestion,
                          optionB: e.target.value,
                        })
                      }
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Option C</label>
                    <input
                      type="text"
                      value={manualQuestion.optionC}
                      onChange={(e) =>
                        setManualQuestion({
                          ...manualQuestion,
                          optionC: e.target.value,
                        })
                      }
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Option D</label>
                    <input
                      type="text"
                      value={manualQuestion.optionD}
                      onChange={(e) =>
                        setManualQuestion({
                          ...manualQuestion,
                          optionD: e.target.value,
                        })
                      }
                      className={inputClass}
                    />
                  </div>
                  <div className="flex gap-4">
                    <>
                      <div className="flex-1">
                        <label className={labelClass}>Correct answer</label>
                        <select
                          value={manualQuestion.correctAnswer}
                          onChange={(e) =>
                            setManualQuestion({
                              ...manualQuestion,
                              correctAnswer: e.target.value,
                            })
                          }
                          className={inputClass}
                        >
                          <option value="">Select correct answer...</option>
                          <option value="a">A</option>
                          <option value="b">B</option>
                          <option value="c">C</option>
                          <option value="d">D</option>
                        </select>
                      </div>
                    </>
                    <>
                      <div className="flex-1">
                        <label className={labelClass}>
                          Time limit (seconds)
                        </label>
                        <input
                          type="number"
                          value={manualQuestion.timeLimit}
                          onChange={(e) =>
                            setManualQuestion({
                              ...manualQuestion,
                              timeLimit: Number(e.target.value) || 20,
                            })
                          }
                          className={inputClass}
                          min="0"
                          placeholder="Enter time in seconds"
                        />
                      </div>
                    </>
                  </div>
                  <div className="flex space-x-2 mt-4">
                    <button
                      onClick={handleManualSubmit}
                      className="btn-primary flex-1 py-2.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-600"
                    >
                      {addMode === "edit" ? "Update" : "Done"}
                    </button>
                    <button
                      onClick={() => {
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
                      }}
                      className="btn-danger flex-1 py-2.5"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
              {manualQuestion.questionType === "true-false" && (
                <>
                  <div className="flex gap-4">
                    <>
                      <div className="flex-1">
                        <label className={labelClass}>Correct answer</label>
                        <select
                          value={manualQuestion.correctAnswer}
                          onChange={(e) =>
                            setManualQuestion({
                              ...manualQuestion,
                              correctAnswer: e.target.value,
                            })
                          }
                          className={inputClass}
                        >
                          <option value="">Select correct answer...</option>
                          <option value="true">True</option>
                          <option value="false">False</option>
                        </select>
                      </div>
                    </>
                    <>
                      <div className="flex-1">
                        <label className={labelClass}>
                          Time limit (seconds)
                        </label>
                        <input
                          type="number"
                          value={manualQuestion.timeLimit}
                          onChange={(e) =>
                            setManualQuestion({
                              ...manualQuestion,
                              timeLimit: Number(e.target.value) || 20,
                            })
                          }
                          className={inputClass}
                          min="0"
                          placeholder="Enter time in seconds"
                        />
                      </div>
                    </>
                  </div>
                  <div className="flex space-x-2 mt-4">
                    <button
                      onClick={handleManualSubmit}
                      className="btn-primary flex-1 py-2.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-600"
                    >
                      {addMode === "edit" ? "Update" : "Done"}
                    </button>
                    <button
                      onClick={() => {
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
                      }}
                      className="btn-danger flex-1 py-2.5"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
              {manualQuestion.questionType === "short-answer" && (
                <>
                  <div className="flex-1">
                    <label className={labelClass}>Time limit (seconds)</label>
                    <input
                      type="number"
                      value={manualQuestion.timeLimit}
                      onChange={(e) =>
                        setManualQuestion({
                          ...manualQuestion,
                          timeLimit: Number(e.target.value) || 60,
                        })
                      }
                      className={inputClass}
                      min="0"
                      placeholder="Enter time in seconds"
                    />
                  </div>
                  <div className="flex space-x-2 mt-4">
                    <button
                      onClick={handleManualSubmit}
                      className="btn-primary flex-1 py-2.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-600"
                    >
                      {addMode === "edit" ? "Update" : "Done"}
                    </button>
                    <button
                      onClick={() => {
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
                      }}
                      className="btn-danger flex-1 py-2.5"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </>
          ) : view === "generate" ? (
            <fieldset
              disabled={loading}
              aria-busy={loading}
              className="m-0 min-w-0 space-y-4 border-0 p-0 transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
            >
              <h2 className="text-xl font-display font-semibold text-inkondark">
                Generate questions
              </h2>
              <>
                <label className={labelClass}>Topic</label>
                <input
                  type="text"
                  value={generateOptions.topic}
                  onChange={(e) =>
                    setGenerateOptions({
                      ...generateOptions,
                      topic: e.target.value,
                    })
                  }
                  className={inputClass}
                  placeholder="Enter the topic for questions (e.g., 'Biology: Cell Division')"
                />
              </>
              <>
                <label className={labelClass}>Question type</label>
                <select
                  value={generateOptions.questionType}
                  onChange={(e) =>
                    setGenerateOptions({
                      ...generateOptions,
                      questionType: e.target.value,
                    })
                  }
                  className={inputClass}
                >
                  <option value="multiple-choice">Multiple choice</option>
                  <option value="true-false">True/False</option>
                  <option value="short-answer">Short answer</option>
                </select>
              </>
              <>
                <label className={labelClass}>Number of questions</label>
                <input
                  type="number"
                  value={generateOptions.questionAmount}
                  onChange={(e) =>
                    setGenerateOptions({
                      ...generateOptions,
                      questionAmount: Number(e.target.value) || 5,
                    })
                  }
                  className={inputClass}
                  min="1"
                  max="10"
                  placeholder="Enter number of questions"
                />
              </>
              <>
                <label className={labelClass}>
                  Time limit per question (seconds)
                </label>
                <input
                  type="number"
                  value={generateOptions.timeLimit}
                  onChange={(e) =>
                    setGenerateOptions({
                      ...generateOptions,
                      timeLimit: Number(e.target.value) || 60,
                    })
                  }
                  className={inputClass}
                  min="0"
                  placeholder="Enter time in seconds"
                />
              </>
              <>
                <label className={labelClass}>Context sources</label>
                <div className="relative">
                  <button
                    onClick={() => setShowSourcesDropdown(!showSourcesDropdown)}
                    className={`${inputClass} text-left flex justify-between items-center`}
                  >
                    <span className="text-muted">
                      {generateOptions.sources &&
                      generateOptions.sources.length > 0
                        ? `${generateOptions.sources.length} document(s) selected`
                        : "Select documents..."}
                    </span>
                    <span className="text-muted">▼</span>
                  </button>
                  {showSourcesDropdown && (
                    <div className="absolute top-full left-0 right-0 rounded-md mt-1 z-10 max-h-48 overflow-y-auto qe-scroll bg-surface border border-muted/20">
                      {docFetchError ? (
                        <div className="px-3 py-2 text-red-400 text-sm">
                          Unable to load documents
                        </div>
                      ) : documents.length > 0 ? (
                        documents.map((doc) => (
                          <label
                            key={doc.id}
                            className="flex items-center px-3 py-2 hover:bg-muted/10 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={(generateOptions.sources || []).some(
                                (id) => Number(id) === Number(doc.id),
                              )}
                              onChange={() => handleToggleSource(doc.id)}
                              className="mr-2 w-4 h-4 cursor-pointer accent-accent"
                            />
                            <span className="text-inkondark text-sm">
                              {doc.title}
                            </span>
                          </label>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-muted text-sm">
                          No documents available
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
              <div className="flex space-x-2 mt-4">
                <button
                  className="btn-primary flex-1 py-2.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-600"
                  onClick={handleGenerate}
                  disabled={loading}
                >
                  {loading ? "Generating..." : "Generate"}
                </button>
                <button
                  onClick={() => setAddMode(null)}
                  disabled={loading}
                  className="btn-danger flex-1 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </fieldset>
          ) : (
            <div className="space-y-3 text-sm">
              <button
                onClick={() => handleModeSelect("generate")}
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
                onClick={() => handleModeSelect("manual")}
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
