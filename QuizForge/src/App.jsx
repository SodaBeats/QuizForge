import React from "react";
import { useState } from "react";
import TopBar from "./components/TopBar";
import SideBar from "./components/SideBar";
import FileViewer from "./components/FileViewer";
import QuestionEditor from "./components/QuestionEditor";

export default function QuizMakerSkeleton() {
  const questions = [{
    id: 'Q1',
    type: 'multiple-choice',
    prompt: 'What is your favorite color?',
    options: [
      {id: 'a', text: 'Blue'},
      { id: "b", text: "Black" },
      { id: "c", text: "Purple" },
      { id: "d", text: "Yellow" }
    ],
    correctOptionId: null
  },{
    id: "Q2",
    type: "multiple-choice",
    prompt: "What is your favorite food?",
    options: [],
    correctOptionId: null
  },{
    id: 'Q3',
    type: 'multiple-choice',
    prompt: 'What is the powerhouse of the cell?',
    options: [
      {id: 'a', text: 'White blood cells'},
      { id: "b", text: "Mitochondria" },
      { id: "c", text: "hemogoblin" },
      { id: "d", text: "cell from dbz" }
    ],
    correctOptionId: null
  }];

  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [selectedFileId, setSelectedFileId] = useState(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);
  const [fileContent, setFileContent] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  //determine which file is selected
  const selectedFile = uploadedFiles?.find(f => f.id === selectedFileId) || null;
  const selectedQuestion = questions?.find(q => q.id === selectedQuestionId) || null;

  console.log(selectedQuestion);

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
      const response = await fetch('http://localhost/TESTQUIZFORGE/api/upload.php', {
        method: 'POST',
        body: data,
      });

      const result = await response.json();

      if(result.success){
        const newFile = {
          id: result.fileId,
          name: result.filename,
          nickname: result.name,
          type: file.type,
          content: result.extractedText
        }
        setUploadedFiles([...uploadedFiles, newFile]);
        setSelectedFileId(result.fileId);

        console.log('File uploaded successfully:', result.fileId);
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
          questions = {questions}
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
          selectedQuestion = {selectedQuestion}
          setSelectedQuestionId = {setSelectedQuestionId}
        />
      </div>
    </div>
  );
}
