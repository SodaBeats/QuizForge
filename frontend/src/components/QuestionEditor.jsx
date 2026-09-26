import React, { useState, useEffect, useContext } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Navigate } from "react-router-dom";
import toast from "react-hot-toast";
import { AuthContext } from "./AuthProvider";

const backendHost = import.meta.env.VITE_BACKEND_HOST;

// shared styling tokens — cosmetic only, referenced by className below
const inputClass =
  "w-full bg-[#26211c] rounded-xl px-3 py-2 text-sm text-[#e8ddce] placeholder:text-[#766a59] shadow-[inset_4px_4px_8px_rgba(0,0,0,0.4),inset_-3px_-3px_7px_rgba(255,255,255,0.04)] focus:outline-none focus:shadow-[inset_5px_5px_10px_rgba(0,0,0,0.45),inset_-4px_-4px_8px_rgba(255,255,255,0.04),0_0_0_3px_rgba(255,148,80,0.35)] transition font-body";
const labelClass = "block text-sm font-medium mb-1.5 text-[#cabaa2] font-body";
const primaryBtnClass =
  "flex-1 font-display font-bold rounded-xl px-4 py-2.5 text-[#3a2010] transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0.5";
const primaryBtnStyle = {
  background: "linear-gradient(155deg, #ffab6b, #ff9450 55%, #e8752a)",
  boxShadow:
    "inset 2px 2px 4px rgba(255,255,255,0.4), inset -3px -3px 6px rgba(80,30,5,0.4), 5px 5px 12px rgba(0,0,0,0.4)",
};
const secondaryBtnClass =
  "flex-1 rounded-xl px-4 py-2.5 transition-all text-[#cabaa2] bg-[#26211c] hover:bg-[#3a3128] shadow-[inset_4px_4px_8px_rgba(0,0,0,0.4),inset_-3px_-3px_7px_rgba(255,255,255,0.04)]";

const scrollStyles = `
  .qe-scroll::-webkit-scrollbar {
    width: 8px;
  }
  .qe-scroll::-webkit-scrollbar-track {
    background: #26211c;
  }
  .qe-scroll::-webkit-scrollbar-thumb {
    background: #4a3f34;
    border-radius: 6px;
  }
  .qe-scroll::-webkit-scrollbar-thumb:hover {
    background: #5c4f42;
  }
  .qe-scroll {
    scrollbar-width: thin;
    scrollbar-color: #4a3f34 #26211c;
  }
`;

export default function QuestionEditor({
  selectedQuestion,
  setSelectedQuestionId,
  quizMetadata,
}) {
  const { authFetch } = useContext(AuthContext);
  const queryClient = useQueryClient();
  const [addMode, setAddMode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState([]);
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

  // FETCH USER DOCUMENTS FOR CONTEXT SOURCES --------------------------------
  const fetchDocuments = async () => {
    try {
      const response = await authFetch(`${backendHost}/api/documents`);
      if (!response || !response.ok) {
        throw new Error(
          `Failed to fetch source documents ${response?.status} ${response?.statusText}`,
        );
      }
      const data = await response.json();
      console.log(data);
      setDocuments(Array.isArray(data.documents) ? data.documents : []);
    } catch (error) {
      console.error("Failed to fetch documents:", error);
      setDocuments([]);
    }
  };

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
    if (mode === "generate") {
      fetchDocuments();
    }
    setAddMode(mode);
  };

  // SUBMIT MANUALLY MADE QUESTION --------------------------------------------
  const handleManualQuestionSubmit = async () => {
    try {
      const queryKey = ["quizQuestions", quizMetadata?.id];

      if (!manualQuestion.questionText) {
        toast.error("Please input a question");
        return;
      }

      const response = await authFetch(`${backendHost}/api/questions/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(manualQuestion),
      });
      if (!response || !response.ok) {
        const result = await response.json();
        throw new Error(
          result?.errors?.map((e) => e.msg).join(", ") ||
            result?.message ||
            "failed to submit question",
        );
      }
      queryClient.invalidateQueries({ queryKey });
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
      toast.error("Something went wrong while submitting question");
    }
  };

  // SUBMIT QUESTION UPDATE ------------------------------------------------------
  const handleQuestionUpdateSubmit = async () => {
    const queryKey = ["quizQuestions", quizMetadata?.id];
    const originalData = queryClient.getQueryData(queryKey);
    queryClient.setQueryData(queryKey, (prev) => ({
      ...prev,
      questionList: prev.questionList.map((q) =>
        q.id === manualQuestion.id ? manualQuestion : q,
      ),
    }));
    try {
      const response = await authFetch(
        `${backendHost}/api/questions/${manualQuestion.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(manualQuestion),
          credentials: "include",
        },
      );
      if (!response || !response.ok) {
        const result = await response.json();
        throw new Error(
          result?.errors?.map((e) => e.msg).join(", ") ||
            result?.message ||
            "failed to update question",
        );
      }
      toast.success("Question Updated!");
    } catch (error) {
      queryClient.setQueryData(queryKey, originalData);
      console.error(`Question update error: ${error}`);
      setAddMode(null);
      setSelectedQuestionId(null);
      toast.error("Something went wrong while updating question");
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
    if (
      generateOptions.questionAmount > 10 ||
      generateOptions.questionAmount < 1
    )
      return toast.error("Maximum of 10 questions per generation");
    setLoading(true);
    const queryKey = ["quizQuestions", quizMetadata?.id];
    try {
      const response = await authFetch(
        `${backendHost}/api/questions/generate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            generateOptions,
            quizId: quizMetadata.id,
          }),
          credentials: "include",
        },
      );

      if (!response || !response.ok) {
        const result = await response.json();
        throw new Error(
          result.errors?.map((e) => e.msg).join(", ") ||
            result?.message ||
            "failed to generate questions",
        );
      }

      const result = await response.json();

      queryClient.setQueryData(queryKey, (prevData) => {
        const existingQuestions = Array.isArray(prevData?.questionList)
          ? prevData.questionList
          : [];
        const newQuestions = Array.isArray(result.questions)
          ? result.questions
          : [];

        return {
          ...prevData,
          questionList: [...existingQuestions, ...newQuestions],
        };
      });

      toast.success("Generated questions added successfully");
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong while generating questions");
    } finally {
      setLoading(false);
    }
  };

  if (!backendHost) {
    return <Navigate to="/error" replace />;
  }

  return (
    <div className="flex-1 flex flex-col bg-[#26211c] font-body p-3">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=Inter:wght@400;500;600&display=swap');
        .font-display { font-family: 'Baloo 2', sans-serif; }
        .font-body { font-family: 'Inter', sans-serif; }
        ${scrollStyles}
      `}</style>

      <div className="flex-1 flex flex-col rounded-2xl bg-[#322b23] overflow-hidden shadow-[6px_6px_14px_rgba(0,0,0,0.4),-4px_-4px_10px_rgba(255,255,255,0.03)]">
        <div className="p-3.5 bg-[#3a3128] flex justify-between items-center">
          <div>
            <h2 className="text-sm font-display font-semibold text-[#e8ddce]">
              Question editor
            </h2>
            <p className="text-xs text-[#766a59] mt-0.5">
              {quizMetadata
                ? `Editing questions for: "${quizMetadata.quizTitle}"`
                : "No quiz selected"}
            </p>
          </div>
        </div>
        <div className="flex-1 p-4 overflow-y-auto space-y-4 qe-scroll">
          {quizMetadata ? (
            addMode === "manual" || addMode === "edit" ? (
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
                        className={primaryBtnClass}
                        style={primaryBtnStyle}
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
                        className={secondaryBtnClass}
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
                        className={primaryBtnClass}
                        style={primaryBtnStyle}
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
                        className={secondaryBtnClass}
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
                        className={primaryBtnClass}
                        style={primaryBtnStyle}
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
                        className={secondaryBtnClass}
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                )}
              </>
            ) : addMode === "generate" ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-display font-semibold text-[#e8ddce]">
                    Generate questions
                  </h2>
                  <button
                    onClick={() => setAddMode(null)}
                    className="text-sm text-[#766a59] hover:text-[#e8ddce] transition-colors"
                  >
                    ← Back
                  </button>
                </div>
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
                      onClick={() =>
                        setShowSourcesDropdown(!showSourcesDropdown)
                      }
                      className={`${inputClass} text-left flex justify-between items-center`}
                    >
                      <span className="text-[#cabaa2]">
                        {generateOptions.sources &&
                        generateOptions.sources.length > 0
                          ? `${generateOptions.sources.length} document(s) selected`
                          : "Select documents..."}
                      </span>
                      <span className="text-[#766a59]">▼</span>
                    </button>
                    {showSourcesDropdown && (
                      <div className="absolute top-full left-0 right-0 rounded-xl mt-1 z-10 max-h-48 overflow-y-auto qe-scroll bg-[#26211c] shadow-[6px_6px_14px_rgba(0,0,0,0.45),-4px_-4px_10px_rgba(255,255,255,0.03)]">
                        {documents.length > 0 ? (
                          documents.map((doc) => (
                            <label
                              key={doc.id}
                              className="flex items-center px-3 py-2 hover:bg-[#3a3128] cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={(generateOptions.sources || []).some(
                                  (id) => Number(id) === Number(doc.id),
                                )}
                                onChange={() => handleToggleSource(doc.id)}
                                className="mr-2 w-4 h-4 cursor-pointer accent-[#ff9450]"
                              />
                              <span className="text-[#cabaa2] text-sm">
                                {doc.title}
                              </span>
                            </label>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-[#766a59] text-sm">
                            No documents available
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
                <div className="flex space-x-2 mt-4">
                  <button
                    className={primaryBtnClass}
                    style={primaryBtnStyle}
                    onClick={handleGenerate}
                    disabled={loading}
                  >
                    {loading ? "Generating..." : "Generate"}
                  </button>
                  <button
                    onClick={() => setAddMode(null)}
                    className={secondaryBtnClass}
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-3 text-sm">
                <button
                  onClick={() => handleModeSelect("generate")}
                  className="w-full rounded-2xl p-4 text-left transition-all bg-[#26211c] hover:bg-[#3a3128] shadow-[6px_6px_14px_rgba(0,0,0,0.4),-4px_-4px_10px_rgba(255,255,255,0.03)]"
                >
                  <div className="text-base font-display font-semibold text-[#e8ddce] flex items-center gap-2">
                    <span className="text-[#ff9450]">✦</span>
                    Generate
                  </div>
                  <div className="mt-1 text-[#a89a86]">
                    Use AI to generate questions for you
                  </div>
                </button>

                <button
                  onClick={() => handleModeSelect("manual")}
                  className="w-full rounded-2xl p-4 text-left transition-all bg-[#26211c] hover:bg-[#3a3128] shadow-[6px_6px_14px_rgba(0,0,0,0.4),-4px_-4px_10px_rgba(255,255,255,0.03)]"
                >
                  <div className="text-base font-display font-semibold text-[#e8ddce]">
                    Make your own
                  </div>
                  <div className="mt-1 text-[#a89a86]">
                    Manually create a custom question
                  </div>
                </button>
              </div>
            )
          ) : (
            <div className="text-[#5f5346] text-sm">
              Select a file from the sidebar to start creating questions
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
