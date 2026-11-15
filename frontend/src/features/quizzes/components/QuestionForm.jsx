const inputClass =
  "w-full bg-darkslate rounded-md px-3 py-2 text-sm text-inkondark placeholder:text-muted border border-muted/30 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 transition font-body";
const labelClass = "block text-sm font-medium mb-1.5 text-inkondark font-body";

export function QuestionForm({
  question,
  setQuestion,
  onSubmit,
  onCancel,
  submitLabel,
}) {
  const openEndedQuestions = [
    "short-answer",
    "general-open-ended-objective",
    "code-output-predict-open-ended-objective",
    "code-explain-open-ended-objective",
  ];
  return (
    <>
      <div>
        <label className={labelClass}>Question type</label>
        <select
          value={question.questionType}
          onChange={(e) =>
            setQuestion({ ...question, questionType: e.target.value })
          }
          className={inputClass}
        >
          <option value="multiple-choice">Multiple choice</option>
          <option value="true-false">True/False</option>
          <option value="short-answer">Short answer</option>
          <option value="general-open-ended-objective">
            Open ended (Objective)
          </option>
          <option value="code-explain-open-ended-objective">
            Code Explanation - Open Ended (Objective)
          </option>
          <option value="code-output-predict-open-ended-objective">
            Code Output Prediction - Open Ended (Objective)
          </option>
        </select>
      </div>
      <div>
        <label className={labelClass}>Question text</label>
        <textarea
          value={question.questionText}
          onChange={(e) =>
            setQuestion({ ...question, questionText: e.target.value })
          }
          className={`${inputClass} h-24 resize-none`}
          placeholder="Enter question..."
        />
      </div>
      {question.questionType === "multiple-choice" && (
        <>
          {["A", "B", "C", "D"].map((option) => {
            const field = `option${option}`;
            return (
              <div key={field}>
                <label className={labelClass}>Option {option}</label>
                <input
                  type="text"
                  value={question[field]}
                  onChange={(e) =>
                    setQuestion({ ...question, [field]: e.target.value })
                  }
                  className={inputClass}
                />
              </div>
            );
          })}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className={labelClass}>Correct answer</label>
              <select
                value={question.correctAnswer}
                onChange={(e) =>
                  setQuestion({ ...question, correctAnswer: e.target.value })
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
            <div className="flex-1">
              <label className={labelClass}>Time limit (seconds)</label>
              <input
                type="number"
                value={question.timeLimit}
                onChange={(e) =>
                  setQuestion({
                    ...question,
                    timeLimit: Number(e.target.value) || 20,
                  })
                }
                className={inputClass}
                min="0"
                placeholder="Enter time in seconds"
              />
            </div>
          </div>
        </>
      )}
      {question.questionType === "true-false" && (
        <div className="flex gap-4">
          <div className="flex-1">
            <label className={labelClass}>Correct answer</label>
            <select
              value={question.correctAnswer}
              onChange={(e) =>
                setQuestion({ ...question, correctAnswer: e.target.value })
              }
              className={inputClass}
            >
              <option value="">Select correct answer...</option>
              <option value="true">True</option>
              <option value="false">False</option>
            </select>
          </div>
          <div className="flex-1">
            <label className={labelClass}>Time limit (seconds)</label>
            <input
              type="number"
              value={question.timeLimit}
              onChange={(e) =>
                setQuestion({
                  ...question,
                  timeLimit: Number(e.target.value) || 20,
                })
              }
              className={inputClass}
              min="0"
              placeholder="Enter time in seconds"
            />
          </div>
        </div>
      )}
      {openEndedQuestions.includes(question.questionType) && (
        <div className="flex-1">
          <label className={labelClass}>Time limit (seconds)</label>
          <input
            type="number"
            value={question.timeLimit}
            onChange={(e) =>
              setQuestion({
                ...question,
                timeLimit: Number(e.target.value) || 60,
              })
            }
            className={inputClass}
            min="0"
            placeholder="Enter time in seconds"
          />
        </div>
      )}
      <div className="flex space-x-2 mt-4">
        <button
          onClick={onSubmit}
          className="btn-primary flex-1 py-2.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-600"
        >
          {submitLabel}
        </button>
        <button onClick={onCancel} className="btn-danger flex-1 py-2.5">
          Cancel
        </button>
      </div>
    </>
  );
}
