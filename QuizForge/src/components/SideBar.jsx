import { useContext, useState } from "react";
import { AuthContext } from "./AuthProvider";

function SideBar({
  uploadedFiles, 
  setUploadedFiles,
  selectedFileId, 
  setSelectedFileId,
  selectedFile,
  selectedQuestionId,
  setSelectedQuestionId,
  questions,
  setQuestions}) {

  const { authFetch } = useContext(AuthContext);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareData, setShareData] = useState({
    title: '',
    description: '',
    shareToken: '', // Will be filled by backend
    timeLimit: '',
    dueDate: ''
  });

  const handleFileDelete = async(fileId) => {

    //const previousFiles = [...uploadedFiles];
    //const previousSelectedId = selectedFileId;

    setUploadedFiles(prev => prev.filter(f=>f.id !== fileId));
    if(selectedFileId === fileId){
      setSelectedFileId(null);
    }
  };

  // Add this function to open modal and fetch token
  const openShareModal = async () => {
    setIsMenuOpen(false);
    setIsShareModalOpen(true);

    // Optional: Pre-fill with file name if available
    if (selectedFile) {
      setShareData(prev => ({ ...prev, title: selectedFile.name }));
    }
    
    // Generate share token from backend
    await handleShareQuiz();
  };

  // Handle share quiz
  const handleShareQuiz = async () => {
    try {
      // TODO: Call your backend API to generate share token
      const response = await authFetch('/api/share-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileId: selectedFileId,
          title: shareData.title,
          description: shareData.description,
          timeLimit: shareData.timeLimit,
          dueDate: shareData.dueDate
        }),
        credentials: 'include'
      });
      
      const data = await response.json();
      
      // Update with token from backend
      setShareData(prev => ({ ...prev, shareToken: data.shareToken }));
      
    } catch (error) {
      console.error('Error sharing quiz:', error);
    }
  };

  const handleQuestionDelete = async(questionId) => {
    
    //store question list as backup
    const previousQuestions = [...questions];
    //store selected question as backup
    const previousSelectedQuestionId = selectedQuestionId;

    setQuestions(prev => prev.filter(q =>q.id !== questionId));
    if(questionId === selectedQuestionId){
      setSelectedQuestionId(null);
    }
    try{

      const response = await authFetch(`http://localhost:3000/api/questions/${questionId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      const deletedQuestion = await response.json();
      
      if(!deletedQuestion.success){
        throw new Error(`Failed to delete question: ${deletedQuestion.message}`)
      }

    }catch(error){
      console.error(error.message, error.status);
      setQuestions(previousQuestions);
      setSelectedQuestionId(previousSelectedQuestionId);
      alert('Something went wrong with the question deletion.');
    }

  };

  return (
    <>
      <div className="w-48 border-r border-gray-700 flex flex-col">
        {/* File List - 30% */}
        <div className="h-[30%] border-b border-gray-700 p-4 overflow-y-auto">
          <div className="text-sm font-semibold text-gray-400 mb-3">Files</div>
          <div className="space-y-1">
            {uploadedFiles.length > 0 ? (
              uploadedFiles.map((file) => (
                <div 
                  key={file.id}
                  className={`py-1 px-2 rounded text-sm flex items-center justify-between group ${
                    selectedFileId === file.id ? 'bg-blue-600' : 'bg-gray-800 hover:bg-gray-700'
                  }`}
                >
                  <div
                    className="cursor-pointer truncate flex-1"
                    onClick={() => setSelectedFileId(file.id)}
                  >
                    {file.name}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFileDelete(file.id);
                      // TODO: Implement delete file logic
                    }}
                    className="ml-2 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  >
                    ✕
                  </button>
                </div>
              ))
            ) : (
              <div className="text-gray-500 text-sm">No file uploaded</div>
            )}
          </div>
        </div>
        
        {/* Question List - 70% */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="flex flex-row items-center justify-between mb-2">
            <div className="text-sm font-semibold text-gray-400">Questions</div>
            {/*Burger Menu*/}
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-1 hover:bg-gray-700 rounded transition-colors"
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              {/* Dropdown Menu */}
              {isMenuOpen && (
                <div className="absolute right-0 mt-1 w-32 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10">
                  <button
                    onClick={openShareModal}
                    className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded-t-lg transition-colors"
                  >
                    Share Quiz
                  </button>
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      // TODO: Export logic
                      console.log('Export');
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded-b-lg transition-colors"
                  >
                    Export
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="space-y-1">
            {selectedFile ? (
              questions.map((question)=>(
                <div
                  key={question.id}
                  className={`py-1 px-2 rounded text-sm flex items-center justify-between group ${
                    selectedQuestionId === question.id ? 'bg-blue-600' : 'bg-gray-800 hover:bg-gray-700'
                  }`}
                >
                  <div
                    className="cursor-pointer truncate flex-1"
                    onClick={() => setSelectedQuestionId(question.id)}
                  >
                    {question.question_text}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuestionDelete(question.id);
                      // TODO: Implement delete question logic
                    }}
                    className="ml-2 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  >
                    ✕
                  </button>
                </div>
              ))
            ):(
              <div className="space-y-1">
                <div className="py-1 px-2 rounded">No Questions</div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Share Quiz Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-96 max-w-full mx-4">
            <h2 className="text-xl font-semibold mb-4">Share Quiz</h2>
            
            <div className="space-y-4">
              {/* Quiz Title */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Quiz Title
                </label>
                <input
                  type="text"
                  value={shareData.title}
                  onChange={(e) => setShareData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="Enter quiz title"
                />
              </div>

              {/* Quiz Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={shareData.description}
                  onChange={(e) => setShareData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500 resize-none"
                  rows="3"
                  placeholder="Enter quiz description"
                />
              </div>

              {/* Share Token (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Share Token
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={shareData.shareToken}
                    readOnly
                    className="flex-1 px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-gray-400 cursor-not-allowed"
                    placeholder="Generating token..."
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(shareData.shareToken);
                      // Optional: Show copied notification
                    }}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    disabled={!shareData.shareToken}
                  >
                    Copy
                  </button>
                </div>
              </div>

              {/* Time Limit */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Time Limit (minutes)
                </label>
                <input
                  type="number"
                  value={shareData.timeLimit}
                  onChange={(e) => setShareData(prev => ({ ...prev, timeLimit: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="Enter time limit"
                  min="1"
                />
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Due Date
                </label>
                <input
                  type="datetime-local"
                  value={shareData.dueDate}
                  onChange={(e) => setShareData(prev => ({ ...prev, dueDate: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setIsShareModalOpen(false);
                  // Reset form
                  setShareData({
                    title: '',
                    description: '',
                    shareToken: '',
                    timeLimit: '',
                    dueDate: ''
                  });
                }}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  // TODO: Save quiz share settings to backend
                  console.log('Saving share settings:', shareData);
                  setIsShareModalOpen(false);
                }}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Share
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
export default SideBar;

