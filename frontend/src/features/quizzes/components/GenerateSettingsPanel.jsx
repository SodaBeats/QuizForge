const inputClass =
  "w-full bg-darkslate rounded-md px-3 py-2 text-sm text-inkondark placeholder:text-muted border border-muted/30 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 transition font-body";
const labelClass = "block text-sm font-medium mb-1.5 text-inkondark font-body";

export function GenerateSettingsPanel({
  loading,
  generateOptions,
  setGenerateOptions,
  showSourcesDropdown,
  setShowSourcesDropdown,
  documents,
  docFetchError,
  onToggleSource,
  onGenerate,
  onCancel,
}) {
  return (
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
      <div>
        <label className={labelClass}>Context sources</label>
        <div className="relative">
          <button
            onClick={() => setShowSourcesDropdown(!showSourcesDropdown)}
            className={`${inputClass} text-left flex justify-between items-center`}
          >
            <span className="text-muted">
              {generateOptions.sources && generateOptions.sources.length > 0
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
                      onChange={() => onToggleSource(doc.id)}
                      className="mr-2 w-4 h-4 cursor-pointer accent-accent"
                    />
                    <span className="text-inkondark text-sm">{doc.title}</span>
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
      </div>
      <div className="flex space-x-2 mt-4">
        <button
          className="btn-primary flex-1 py-2.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-600"
          onClick={onGenerate}
          disabled={loading}
        >
          {loading ? "Generating..." : "Generate"}
        </button>
        <button
          onClick={onCancel}
          disabled={loading}
          className="btn-danger flex-1 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
      </div>
    </fieldset>
  );
}
