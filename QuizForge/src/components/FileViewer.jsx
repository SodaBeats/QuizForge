
export default function FileViewer({ fileContent }) {
  return (
    <div className="w-1/2 flex flex-col border-r border-gray-700">
      <div className="border-b border-gray-700 p-3 bg-gray-800">
        <h2 className="text-sm font-semibold">Source File Viewer</h2>
        <p className="text-xs text-gray-400">PDF/text viewer</p>
      </div>
      <div className="flex-1 overflow-y-auto p-4 bg-gray-850">
        <div className="text-gray-500 text-sm">
          No file uploaded
        </div>
      </div>
    </div>
  );
}