import React, { useContext } from "react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { AuthContext } from "../components/AuthProvider";
import TopBar from "../components/TopBar";
import SideBar from "../components/SideBar";
import FileViewer from "../components/FileViewer";
import QuestionEditor from "../components/QuestionEditor";

export default function QuizMakerSkeleton() {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [selectedFileId, setSelectedFileId] = useState(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [quizMetadata, setQuizMetadata] = useState(null);
  const { authFetch } = useContext(AuthContext);

  const backendHost = import.meta.env.VITE_BACKEND_HOST;
  if (!backendHost) throw new Error("Missing backend host");

  //determine which file is selected
  const selectedFile =
    uploadedFiles?.find((f) => f.id === selectedFileId) || null;
  const selectedQuestion =
    questions?.find((q) => q.id === selectedQuestionId) ?? null;

  //load file from local storage and remove after 1 minute
  const STATE_KEY = "quizForgeState";
  const TTL = 1000 * 60; //1minute
  useEffect(() => {
    try {
      const savedState = localStorage.getItem(STATE_KEY);
      if (!savedState) return;

      const { data, savedAt } = JSON.parse(savedState);
      if (Date.now() - savedAt < TTL) {
        setUploadedFiles([...data]);
      } else {
        localStorage.removeItem(STATE_KEY);
      }
    } catch {
      localStorage.removeItem(STATE_KEY);
    } // eslint-disable-next-line
  }, []);

  //handle uploaded file
  const handleFileUpload = async (file) => {
    setIsUploading(true);

    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/pdf", // .docx
    ];
    const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload a DOCX or PDF file");
      return;
    }

    // 2. Check File Size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error(`File is too large. Maximum size is 2MB.`);
      return;
    }

    const data = new FormData();
    data.append("file", file);

    try {
      const response = await authFetch(`${backendHost}/api/upload`, {
        method: "POST",
        body: data,
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        const newFile = {
          id: result.fileId,
          name: result.fileName,
          nickname: result.fileName,
          type: file.type,
          content: result.content,
        };
        setUploadedFiles([...uploadedFiles, newFile]);
        setSelectedFileId(result.fileId);
      } else {
        alert("Error: " + result.error);
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload file. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  //save uploaded file into local storage
  useEffect(() => {
    if (uploadedFiles.length > 0) {
      localStorage.setItem(
        STATE_KEY,
        JSON.stringify({
          data: uploadedFiles,
          savedAt: Date.now(),
        }),
      );
    }
  }, [uploadedFiles]);

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-gray-100">
      {/* Top Bar */}
      <TopBar
        handleFileUpload={handleFileUpload}
        isUploading={isUploading}
        setSelectedFileId={setSelectedFileId}
        selectedFileId={selectedFileId}
        setUploadedFiles={setUploadedFiles}
        selectedFile={selectedFile}
        questions={questions}
        setQuizMetadata={setQuizMetadata}
        quizMetadata={quizMetadata}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Sidebar */}
        <SideBar
          uploadedFiles={uploadedFiles}
          setUploadedFiles={setUploadedFiles}
          selectedFileId={selectedFileId}
          setSelectedFileId={setSelectedFileId}
          selectedFile={selectedFile}
          selectedQuestionId={selectedQuestionId}
          setSelectedQuestionId={setSelectedQuestionId}
          selectedQuestion={selectedQuestion}
          questions={questions}
          setQuestions={setQuestions}
          currentQuiz={quizMetadata}
          setCurrentQuiz={setQuizMetadata}
        />

        {/* Middle: Source File Viewer */}
        <FileViewer
          fileContent={selectedFile?.content}
          selectedFile={selectedFile}
        />

        {/* Right: Question Editor */}
        <QuestionEditor
          setSelectedQuestionId={setSelectedQuestionId}
          selectedQuestionId={selectedQuestionId}
          selectedFile={selectedFile}
          selectedFileId={selectedFileId}
          questions={questions}
          setQuestions={setQuestions}
          selectedQuestion={selectedQuestion}
          quizMetadata={quizMetadata}
        />
      </div>
    </div>
  );
}
