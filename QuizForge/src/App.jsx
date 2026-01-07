import React from "react";
import { useState } from "react";
import TopBar from "./components/TopBar";
import SideBar from "./components/SideBar";
import FileViewer from "./components/FileViewer";
import QuestionEditor from "./components/QuestionEditor";

export default function QuizMakerSkeleton() {

  const [uploadedFile, setUploadedFile] = useState(null);
  const [fileContent, setFileContent] = useState(null);

  const handleFileUpload = (file) => {
    setUploadedFile(file);

    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    ];
    
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a .docx file');
      return;
    }
    setFileContent('Uploading and processing file...');

  }

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-gray-100">
      {/* Top Bar */}
      <TopBar 
        handleFileUpload={handleFileUpload}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Sidebar */}
        <SideBar 
          uploadedFile={uploadedFile}
        />

        {/* Middle: Source File Viewer */}
        <FileViewer />

        {/* Right: Question Editor */}
        <QuestionEditor />
      </div>
    </div>
  );
}
