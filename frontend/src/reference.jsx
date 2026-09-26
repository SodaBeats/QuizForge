import React, { useState } from 'react';
import TopBar from './components/layout/TopBar';
import Sidebar from './components/layout/Sidebar';
import FileViewer from './components/layout/FileViewer';
import QuestionEditor from './components/layout/QuestionEditor';

export default function QuizMaker() {
  const [quizTitle, setQuizTitle] = useState('Untitled Quiz');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [selectedFileId, setSelectedFileId] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [questions, setQuestions] = useState([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);

  const selectedQuestion = questions.find(q => q.id === selectedQuestionId);
  const selectedFile = uploadedFiles?.find(f => f.id === selectedFileId) || null;

  const handleFileUpload = async (file) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    ];
    
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a .docx file');
      return;
    }
    setFileContent('Uploading and processing file...');

    // Create FormData to send file
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost/PROJECTquizmaker/api/upload.php', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        // Add new file to the array
        const newFile = {
          id: result.fileId,
          name: result.filename,
          type: file.type,
          content: result.extractedText
        };
        
        setUploadedFiles([...uploadedFiles, newFile]);
        setSelectedFileId(result.fileId); // Auto-select the newly uploaded file
        
        console.log('File uploaded successfully:', result.fileId);
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setFileContent('Failed to upload file');
      alert('Failed to upload file. Please try again.');
    }
  };

  const handleAddQuestion = () => {
    const newQuestion = {
      id: questions.length + 1,
      text: '',
      type: 'Multiple Choice',
      options: []
    };
    setQuestions([...questions, newQuestion]);
    setSelectedQuestionId(newQuestion.id);
  };

  const handleUpdateQuestion = (updatedQuestion) => {
    setQuestions(questions.map(q => 
      q.id === updatedQuestion.id ? updatedQuestion : q
    ));
  };

  const handleSave = () => {
    console.log('Saving quiz...', { quizTitle, questions });
    // Add save logic
  };

  const handleExport = () => {
    console.log('Exporting quiz...');
    // Add export logic
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">

      <TopBar
        quizTitle={quizTitle}
        onQuizTitleChange={setQuizTitle}
        onFileUpload={handleFileUpload}
        onSave={handleSave}
        onExport={handleExport}
      />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        <Sidebar
          uploadedFiles={uploadedFiles}
          selectedFileId={selectedFileId} 
          onSelectFile={setSelectedFileId} 
          questions={questions}
          selectedQuestionId={selectedQuestionId}
          onSelectQuestion={setSelectedQuestionId}
          onAddQuestion={handleAddQuestion}
        />

        {/* Main Window */}
        <div className="flex-1 flex flex-col">

          {/* File Viewer - Top Half */}
          <FileViewer 
            uploadedFiles={uploadedFiles}
            selectedFile ={selectedFile}
            fileContent={selectedFile?.content} 
          />

          {/* Question Editor - Bottom Half */}
          <QuestionEditor
            selectedQuestion={selectedQuestion}
            onUpdateQuestion={handleUpdateQuestion}
          />
        </div>
      </div>
    </div>
  );
}