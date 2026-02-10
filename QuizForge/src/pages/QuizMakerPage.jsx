import React, { useContext } from "react";
import { useState, useEffect } from "react";
import { AuthContext } from "../components/AuthProvider";
import TopBar from "../components/TopBar";
import SideBar from "../components/SideBar";
import FileViewer from "../components/FileViewer";
import QuestionEditor from "../components/QuestionEditor";



export default function QuizMakerSkeleton() {

  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [selectedFileId, setSelectedFileId] = useState(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);
  const [fileContent, setFileContent] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const { authFetch } = useContext(AuthContext);

  //determine which file is selected
  const selectedFile = uploadedFiles?.find(f => f.id === selectedFileId) || null;
  const selectedQuestion = questions?.find(q => q.id === selectedQuestionId) || null;

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
      const response = await authFetch('http://localhost:3000/api/upload', {
        method: 'POST',
        body: data,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      //console.log('Upload response:', result);

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

  useEffect(()=> {
    if (!selectedFileId) return;
    authFetch(`http://localhost:3000/api/questions?documentId=${selectedFileId}`)
      .then(res => res.json())
      .then(data => setQuestions(data));
      //eslint-disable-next-line
  }, [selectedFileId]);

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
          selectedFile = {selectedFile}
          selectedQuestionId = {selectedQuestionId}
          setSelectedQuestionId = {setSelectedQuestionId}
          selectedQuestion = {selectedQuestion}
          questions = {questions}
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
          selectedQuestion={selectedQuestion}
        />
      </div>
    </div>
  );
}
