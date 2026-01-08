
export default function QuestionEditor({ selectedQuestion }) {


  return (
    <div className="flex-1 flex flex-col">
      <div className="border-b border-gray-700 p-3 bg-gray-800">
        <h2 className="text-sm font-semibold">Question Editor</h2>
        <p className="text-xs text-gray-400">
          {selectedQuestion ? `Editing ${selectedQuestion.id}` : 'No question selected'}
        </p>
      </div>
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {selectedQuestion? (
          <>
            <div>
              <label className="block text-sm mb-1 text-gray-400">Question Text</label>
              <textarea 
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded h-24 resize-none"
                placeholder="Enter question..."
                value={selectedQuestion.prompt}
              />
            </div>
            <div>
              <label className="block text-sm mb-1 text-gray-400">Options</label>
              <div className="space-y-2">
                {selectedQuestion.options.length > 0 ? (
                  selectedQuestion.options.map((option) => (
                    <div 
                      key={option.id} 
                      className="flex items-center gap-2"
                    >

                      <span className="text-gray-400 text-sm w-6">{option.id.toUpperCase()}.</span>
                      <input 
                        type="text" 
                        className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded"
                        value={option.text}
                        readOnly
                      />

                    </div>
                  ))
                ) : (
                  <div className="text-gray-500 text-sm">No options available</div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm mb-1 text-gray-400">Correct Answer</label>
              <select 
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded"
                value={selectedQuestion.correctOptionId || ''}
                disabled
              >
                <option value="">Select correct answer...</option>
                {selectedQuestion.options.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.id.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </>
        ):(
          <div className="text-gray-500 text-sm">
            Select a question from the sidebar to edit
          </div>
        )}
      </div>
    </div>
  );
}