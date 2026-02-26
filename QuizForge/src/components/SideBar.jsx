import { useContext } from "react";
import { AuthContext } from "./AuthProvider";

function SideBar({
  uploadedFiles, 
  setUploadedFiles,
  selectedFileId, 
  setSelectedFileId,
  selectedFile,
  selectedQuestionId,
  setSelectedQuestionId,
  questions}) {

    const { authFetch } = useContext(AuthContext);

    const handleFileDelete = async(fileId) => {

      //const previousFiles = [...uploadedFiles];
      //const previousSelectedId = selectedFileId;

      setUploadedFiles(prev => prev.filter(f=>f.id !== fileId));
      if(selectedFileId === fileId){
        setSelectedFileId(null);
      }

      /*try{
        const response = await authFetch(`http://localhost:3000/api/documents/${fileId}`, {
          method: 'DELETE',
          credentials: 'include'
        });

        const deletedFile = await response.json();

        if(!deletedFile.success){
          throw new Error(`Failed to delete file: ${deletedFile.message}`);
        }

      }catch(error){
        console.error(error.message, error.status);
        setUploadedFiles(previousFiles);
        setSelectedFileId(previousSelectedId);
        alert('Something went wrong with the file deletion');
      }
        */
      
    };

  return (
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
        <div className="text-sm font-semibold text-gray-400 mb-2">Questions</div>
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
                    console.log('Delete question:', question.id);
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
  );
}
export default SideBar;

