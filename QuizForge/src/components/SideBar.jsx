
function SideBar() {
  return (
    <div className="w-48 border-r border-gray-700 flex flex-col">
      {/* File List - 30% */}
      <div className="h-[30%] border-b border-gray-700 p-4 overflow-y-auto">
        <div className="text-sm font-semibold text-gray-400 mb-3">Files</div>
        <div className="space-y-1">
          <div className="py-1 px-2 hover:bg-gray-800 rounded cursor-pointer text-sm">document.pdf</div>
        </div>
      </div>
      
      {/* Question List - 70% */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="text-sm font-semibold text-gray-400 mb-2">Questions</div>
        <div className="space-y-1">
          <div className="py-1 px-2 hover:bg-gray-800 rounded cursor-pointer">Q1</div>
          <div className="py-1 px-2 hover:bg-gray-800 rounded cursor-pointer">Q2</div>
          <div className="py-1 px-2 hover:bg-gray-800 rounded cursor-pointer">Q3</div>
          <div className="py-1 px-2 text-gray-600">...</div>
        </div>
      </div>
    </div>
  );
}
export default SideBar;