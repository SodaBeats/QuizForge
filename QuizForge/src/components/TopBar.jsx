import React, { useState, useContext } from "react";
import { AuthContext } from "./AuthProvider";

export default function TopBar({ handleFileUpload, isUploading, setSelectedFileId, selectedFileId, setUploadedFiles}) {

  const [isLoading, setIsLoading] = useState(false);
  const [showFileModal, setShowFileModal] = useState(false);
  const [userDocuments, setUserDocuments] = useState([]);
  const { logout, authFetch } = useContext(AuthContext);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if(file){
      handleFileUpload(file);
      setShowFileModal(false);
    }
  }

  const handleLogout = () => {
    try{
      setIsLoading(true);
      logout();
    }
    catch(error){
      alert('Error: ' + error);
    }
    finally{
      setIsLoading(false);
    }
  };

  const openFileModal = async() => {
    setShowFileModal(true);
    const response = await authFetch('http://localhost:3000/api/documents', {
      credentials: 'include'
    });
    const documents = await response.json();
    if(!response.ok){
      alert('Error:'+ response.error)
    }
    setUserDocuments(documents);
  };

  const closeFileModal = () => {
    setShowFileModal(false);
  };

  const handleSelectDocument = async (doc) => {
    // close modal and select immediately
    setShowFileModal(false);
    setSelectedFileId(doc.id);

    // ensure parent has an entry for this doc (without copying any large content)
    setUploadedFiles(prev => prev.some(f => f.id === doc.id) ? prev : [
      ...prev,
      {
        id: doc.id,
        name: doc.title || String(doc.id),
        nickname: doc.title || String(doc.id),
        content: null
      }
    ]);

    // fetch full content on demand and merge into parent state
    try {
      const resp = await authFetch(`http://localhost:3000/api/documents/${doc.id}`, {
        credentials: 'include'
      });
      if (!resp.ok) {
        throw new Error(`HTTP error! status: ${resp.status}`);
      }
      const full = await resp.json();

      if (!full.success){
        alert('Error: ' + full.error);
        return;
      }

      setUploadedFiles(prev => prev.map(f => f.id === doc.id ? { ...f, content: full.content ?? f.content } : f));
      //setUploadedFiles(prev => prev.map(f => f.id === doc.id ? { ...f, content: full.content ?? f.content, name: full.title ?? f.name } : f));

    } catch (err) {
      // swallow — parent can request content later
      console.error('Document selection error: ', err);
      alert('Failed to select document. Please try again later');
    }
  };

  return (
    <div className="border-b border-gray-700 p-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button 
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded border border-gray-600"
          onClick={openFileModal}
        >
          Files
        </button>
        <input 
          type="file"
          id="file-upload"
          className="hidden"
          accept=".pdf,.txt,.docx,.doc"
          onChange={(e) => {handleFileChange(e);}}
        />
        {showFileModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg shadow-lg w-96 max-h-[80vh] overflow-y-auto border border-gray-700 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">My Documents</h2>
                <button
                  onClick={closeFileModal}
                  className="text-gray-400 hover:text-white text-2xl leading-none"
                >
                  ×
                </button>
              </div>

              <div className="space-y-2 mb-6">
                {userDocuments.length > 0 ? (
                  userDocuments.map((doc) => (
                    <div
                      key={doc.id}
                        onClick={() => handleSelectDocument(doc)}
                      className={`p-3 rounded cursor-pointer border transition-colors text-white ${
                        selectedFileId === doc.id
                          ? 'bg-blue-600 border-blue-500'
                          : 'bg-gray-700 hover:bg-gray-600 border-gray-600'
                      }`}
                    >
                      <span className="truncate">{doc.title || doc}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-center py-4">No documents found</p>
                )}
              </div>

              <div className="border-t border-gray-700 pt-4">
                <button
                  onClick={() => document.getElementById('file-upload').click()}
                  disabled={isUploading}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded border border-blue-500 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? 'Uploading...' : 'Upload New Document'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded border border-gray-600">
          Save
        </button>
        <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded border border-gray-600">
          Export
        </button>
        <button 
          className="px-4 py-2 bg-red-800 hover:bg-red-700 rounded border border-red-600"
          disabled = {isLoading}
          onClick = { handleLogout }
        >
          Logout
        </button>
      </div>
    </div>
  );
}