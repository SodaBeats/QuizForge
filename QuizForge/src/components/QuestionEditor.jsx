import React, { useState, useEffect, useContext } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Navigate } from "react-router-dom";
import toast from "react-hot-toast";
import { AuthContext } from "./AuthProvider";

const backendHost = import.meta.env.VITE_BACKEND_HOST;

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
    <div className="flex-1 flex flex-col">
      <div className="border-b border-gray-700 p-3 bg-gray-800 flex justify-between items-center">
        <div>
          <h2 className="text-sm font-semibold">Question Editor</h2>
          <p className="text-xs text-gray-400">
            {quizMetadata
              ? `Editing questions for: "${quizMetadata.quizTitle}"`
              : "No quiz selected"}
          </p>
        </div>
      </div>
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {quizMetadata ? (
          addMode === "manual" || addMode === "edit" ? (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Question Type
                </label>
                <select
                  value={manualQuestion.questionType}
                  onChange={(e) =>
                    setManualQuestion({
                      ...manualQuestion,
                      questionType: e.target.value,
                    })
                  }
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                >
                  <option value="multiple-choice">Multiple Choice</option>
                  <option value="true-false">True/False</option>
                  <option value="short-answer">Short Answer</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1 text-gray-400">
                  Question Text
                </label>
                <textarea
                  value={manualQuestion.questionText}
                  onChange={(e) =>
                    setManualQuestion({
                      ...manualQuestion,
                      questionText: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded h-24 resize-none"
                  placeholder="Enter question..."
                />
              </div>
              {manualQuestion.questionType === "multiple-choice" && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Option A
                    </label>
                    <input
                      type="text"
                      value={manualQuestion.optionA}
                      onChange={(e) =>
                        setManualQuestion({
                          ...manualQuestion,
                          optionA: e.target.value,
                        })
                      }
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Option B
                    </label>
                    <input
                      type="text"
                      value={manualQuestion.optionB}
                      onChange={(e) =>
                        setManualQuestion({
                          ...manualQuestion,
                          optionB: e.target.value,
                        })
                      }
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Option C
                    </label>
                    <input
                      type="text"
                      value={manualQuestion.optionC}
                      onChange={(e) =>
                        setManualQuestion({
                          ...manualQuestion,
                          optionC: e.target.value,
                        })
                      }
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Option D
                    </label>
                    <input
                      type="text"
                      value={manualQuestion.optionD}
                      onChange={(e) =>
                        setManualQuestion({
                          ...manualQuestion,
                          optionD: e.target.value,
                        })
                      }
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                    />
                  </div>
                  <div className="flex gap-4">
                    <>
                      <div className="flex-1">
                        <label className="block text-sm font-medium mb-1">
                          Correct Answer
                        </label>
                        <select
                          value={manualQuestion.correctAnswer}
                          onChange={(e) =>
                            setManualQuestion({
                              ...manualQuestion,
                              correctAnswer: e.target.value,
                            })
                          }
                          className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
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
                        <label className="block text-sm font-medium mb-1">
                          Time Limit (seconds)
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
                          className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                          min="0"
                          placeholder="Enter time in seconds"
                        />
                      </div>
                    </>
                  </div>
                  <div className="flex space-x-2 mt-4">
                    <button
                      onClick={handleManualSubmit}
                      className="flex-1 bg-blue-600 hover:bg-blue-500 text-white rounded px-4 py-2"
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
                      className="flex-1 bg-gray-600 hover:bg-gray-500 text-white rounded px-4 py-2"
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
                        <label className="block text-sm font-medium mb-1">
                          Correct Answer
                        </label>
                        <select
                          value={manualQuestion.correctAnswer}
                          onChange={(e) =>
                            setManualQuestion({
                              ...manualQuestion,
                              correctAnswer: e.target.value,
                            })
                          }
                          className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                        >
                          <option value="">Select correct answer...</option>
                          <option value="true">True</option>
                          <option value="false">False</option>
                        </select>
                      </div>
                    </>
                    <>
                      <div className="flex-1">
                        <label className="block text-sm font-medium mb-1">
                          Time Limit (seconds)
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
                          className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                          min="0"
                          placeholder="Enter time in seconds"
                        />
                      </div>
                    </>
                  </div>
                  <div className="flex space-x-2 mt-4">
                    <button
                      onClick={handleManualSubmit}
                      className="flex-1 bg-blue-600 hover:bg-blue-500 text-white rounded px-4 py-2"
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
                      className="flex-1 bg-gray-600 hover:bg-gray-500 text-white rounded px-4 py-2"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
              {manualQuestion.questionType === "short-answer" && (
                <>
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">
                      Time Limit (seconds)
                    </label>
                    <input
                      type="number"
                      value={manualQuestion.timeLimit}
                      onChange={(e) =>
                        setManualQuestion({
                          ...manualQuestion,
                          timeLimit: Number(e.target.value) || 60,
                        })
                      }
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                      min="0"
                      placeholder="Enter time in seconds"
                    />
                  </div>
                  <div className="flex space-x-2 mt-4">
                    <button
                      onClick={handleManualSubmit}
                      className="flex-1 bg-blue-600 hover:bg-blue-500 text-white rounded px-4 py-2"
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
                      className="flex-1 bg-gray-600 hover:bg-gray-500 text-white rounded px-4 py-2"
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
                <h2 className="text-xl font-bold">Generate Questions</h2>
                <button
                  onClick={() => setAddMode(null)}
                  className="text-sm text-gray-400 hover:text-white"
                >
                  ← Back
                </button>
              </div>
              <>
                <label className="block text-sm font-medium mb-1">Topic</label>
                <input
                  type="text"
                  value={generateOptions.topic}
                  onChange={(e) =>
                    setGenerateOptions({
                      ...generateOptions,
                      topic: e.target.value,
                    })
                  }
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                  placeholder="Enter the topic for questions (e.g., 'Biology: Cell Division')"
                />
              </>
              <>
                <label className="block text-sm font-medium mb-1">
                  Question Type
                </label>
                <select
                  value={generateOptions.questionType}
                  onChange={(e) =>
                    setGenerateOptions({
                      ...generateOptions,
                      questionType: e.target.value,
                    })
                  }
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                >
                  <option value="multiple-choice">Multiple Choice</option>
                  <option value="true-false">True/False</option>
                  <option value="short-answer">Short Answer</option>
                </select>
              </>
              <>
                <label className="block text-sm font-medium mb-1">
                  Number of Questions
                </label>
                <input
                  type="number"
                  value={generateOptions.questionAmount}
                  onChange={(e) =>
                    setGenerateOptions({
                      ...generateOptions,
                      questionAmount: Number(e.target.value) || 5,
                    })
                  }
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                  min="1"
                  placeholder="Enter number of questions"
                />
              </>
              <>
                <label className="block text-sm font-medium mb-1">
                  Time Limit per Question (seconds)
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
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                  min="0"
                  placeholder="Enter time in seconds"
                />
              </>
              <>
                <label className="block text-sm font-medium mb-1">
                  Context Sources
                </label>
                <div className="relative">
                  <button
                    onClick={() => setShowSourcesDropdown(!showSourcesDropdown)}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-left flex justify-between items-center"
                  >
                    <span className="text-gray-300">
                      {generateOptions.sources &&
                      generateOptions.sources.length > 0
                        ? `${generateOptions.sources.length} document(s) selected`
                        : "Select documents..."}
                    </span>
                    <span className="text-gray-400">▼</span>
                  </button>
                  {showSourcesDropdown && (
                    <div className="absolute top-full left-0 right-0 bg-gray-700 border border-gray-600 rounded mt-1 z-10 max-h-48 overflow-y-auto">
                      {documents.length > 0 ? (
                        documents.map((doc) => (
                          <label
                            key={doc.id}
                            className="flex items-center px-3 py-2 hover:bg-gray-600 cursor-pointer border-b border-gray-600 last:border-b-0"
                          >
                            <input
                              type="checkbox"
                              checked={(generateOptions.sources || []).some(
                                (id) => Number(id) === Number(doc.id),
                              )}
                              onChange={() => handleToggleSource(doc.id)}
                              className="mr-2 w-4 h-4 cursor-pointer"
                            />
                            <span className="text-gray-200 text-sm">
                              {doc.title}
                            </span>
                          </label>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-gray-400 text-sm">
                          No documents available
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
              <div className="flex space-x-2 mt-4">
                <button
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white rounded px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleGenerate}
                  disabled={loading}
                >
                  {loading ? "Generating..." : "Generate"}
                </button>
                <button
                  onClick={() => setAddMode(null)}
                  className="flex-1 bg-gray-600 hover:bg-gray-500 text-white rounded px-4 py-2"
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-3 text-sm">
              <button
                onClick={() => handleModeSelect("generate")}
                className="w-full rounded-lg bg-gray-700 p-4 text-left transition hover:bg-gray-600"
              >
                <div className="text-base font-semibold text-white">
                  Generate
                </div>
                <div className="mt-1 text-gray-400">
                  Use AI to generate questions for you
                </div>
              </button>

              <button
                onClick={() => handleModeSelect("manual")}
                className="w-full rounded-lg bg-gray-700 p-4 text-left transition hover:bg-gray-600"
              >
                <div className="text-base font-semibold text-white">
                  Make Your Own
                </div>
                <div className="mt-1 text-gray-400">
                  Manually create a custom question
                </div>
              </button>
            </div>
          )
        ) : (
          <div className="text-gray-500 text-sm">
            Select a file from the sidebar to start creating questions
          </div>
        )}
      </div>
    </div>
  );
}
