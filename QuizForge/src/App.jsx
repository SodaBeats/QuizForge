import React from "react";
import { useState, useEffect } from "react";
import TopBar from "./components/TopBar";
import SideBar from "./components/SideBar";
import FileViewer from "./components/FileViewer";
import QuestionEditor from "./components/QuestionEditor";

export default function QuizMakerSkeleton() {

  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [selectedFileId, setSelectedFileId] = useState(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);
  const [fileContent, setFileContent] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [questions, setQuestions] = useState([]);

  //determine which file is selected
  const selectedFile = uploadedFiles?.find(f => f.id === selectedFileId) || null;

  //load file from local storage and remove after 1 minute
  const STATE_KEY = "quizForgeState";
  const TTL = 1000*60; //1minute
  useEffect(()=>{
    try{
      const savedState = localStorage.getItem(STATE_KEY);
      if (!savedState) return;

      const {data, savedAt} = JSON.parse(savedState);
      if (Date.now()-savedAt < TTL){
        setUploadedFiles([...data]);
      }
      else{
        localStorage.removeItem(STATE_KEY);
      }
    }catch{
      localStorage.removeItem(STATE_KEY);
    }

  },[]);

  //handle uploaded file
  const handleFileUpload = async (file) => {

    setIsUploading(true);

    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    ];
    
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a .docx file');
      return;
    }
    setFileContent('Uploading and processing file...');

    const data = new FormData();
    data.append('file', file);

    try{
      const response = await fetch('http://localhost:3000/api/upload', {
        method: 'POST',
        body: data,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Upload response:', result);

      if(result.success){
        const newFile = {
          id: result.fileId,
          name: result.fileName,
          nickname: result.fileName,
          type: file.type,
          content: result.content
        }
        setUploadedFiles([...uploadedFiles, newFile]);
        setSelectedFileId(result.fileId);
        setFileContent(result.content);

      } 
      else {
        alert('Error: ' + result.error);
      }

    }catch(error){
      console.error('Upload error:', error);
      setFileContent('Failed to upload file');
      alert('Failed to upload file. Please try again.');
    }finally{
      setIsUploading(false);
    }

  }

  //save uploaded file into local storage
  useEffect(()=>{
    if(uploadedFiles.length>0){
      localStorage.setItem(
        STATE_KEY, 
        JSON.stringify({
          data: uploadedFiles,
          savedAt: Date.now()
        })
      )
    }
  }, [uploadedFiles]);

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-gray-100">
      
      {/* Top Bar */}
      <TopBar 
        handleFileUpload={handleFileUpload}
        isUploading = {isUploading}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left: Sidebar */}
        <SideBar 
          uploadedFiles={uploadedFiles}
          selectedFileId = {selectedFileId}
          setSelectedFileId = {setSelectedFileId}
          selectedQuestionId = {selectedQuestionId}
          setSelectedQuestionId = {setSelectedQuestionId}
        />

        {/* Middle: Source File Viewer */}
        <FileViewer
          fileContent={selectedFile?.content}
          selectedFile={selectedFile}
        />

        {/* Right: Question Editor */}
        <QuestionEditor
          setSelectedQuestionId = {setSelectedQuestionId}
          selectedFile = {selectedFile}
          selectedFileId = {selectedFileId}
          questions = {questions}
          setQuestions = {setQuestions}
        />
      </div>
    </div>
  );
}
