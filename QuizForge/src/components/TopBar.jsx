import React, { useState, useContext } from "react";
import { AuthContext } from "./AuthProvider";

export default function TopBar({ handleFileUpload, isUploading }) {

  const [isLoading, setIsLoading] = useState(false);
  const {logout} = useContext(AuthContext);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if(file){
      handleFileUpload(file);
    }
    // Additional logic for handling the uploaded file can be added here
  }

  const handleLogout = ()=>{

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

  return (
    <div className="border-b border-gray-700 p-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button 
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded border border-gray-600"
          disabled={isUploading}
          onClick={() => document.getElementById('file-upload').click()}
        >
          {isUploading? 'Uploading...':'Upload'}
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