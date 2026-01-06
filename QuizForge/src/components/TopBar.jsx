

export default function TopBar() {
  return (
    <div className="border-b border-gray-700 p-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded border border-gray-600">
          Upload
        </button>
        <input 
          type="text" 
          placeholder="Quiz Title" 
          className="px-3 py-2 bg-gray-800 border border-gray-600 rounded w-64"
        />
      </div>
      <div className="flex items-center gap-2">
        <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded border border-gray-600">
          Actions
        </button>
      </div>
    </div>
  );
}