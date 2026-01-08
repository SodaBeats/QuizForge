
export default function QuestionEditor() {

  return (
    <div className="flex-1 flex flex-col">
      <div className="border-b border-gray-700 p-3 bg-gray-800">
        <h2 className="text-sm font-semibold">Question Editor</h2>
        <p className="text-xs text-gray-400">Edit selected question</p>
      </div>
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        <div>
          <label className="block text-sm mb-1 text-gray-400">Question Text</label>
          <textarea 
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded h-24 resize-none"
            placeholder="Enter question..."
          />
        </div>
        <div>
          <label className="block text-sm mb-1 text-gray-400">Options</label>
          <div className="space-y-2">
            <input 
              type="text" 
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded"
              placeholder="Option A"
            />
            <input 
              type="text" 
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded"
              placeholder="Option B"
            />
            <input 
              type="text" 
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded"
              placeholder="Option C"
            />
            <input 
              type="text" 
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded"
              placeholder="Option D"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm mb-1 text-gray-400">Correct Answer</label>
          <select className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded">
            <option>Select correct answer...</option>
            <option>A</option>
            <option>B</option>
            <option>C</option>
            <option>D</option>
          </select>
        </div>
      </div>
    </div>
  );
}