import React from "react";

export default function TopBar({ handleFileUpload }) {

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if(file){
      handleFileUpload(file);
    }
    // Additional logic for handling the uploaded file can be added here
  }

  return (
    <div className="border-b border-gray-700 p-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button 
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded border border-gray-600"
          onClick={() => document.getElementById('file-upload').click()}
        >
          Upload
        </button>
        <input 
          type="file"
          id="file-upload"
          className="hidden"
          accept=".pdf,.txt,.docx,.doc"
          onChange={(e) => {handleFileChange(e);}}
        />
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