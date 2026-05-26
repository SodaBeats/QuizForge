import React, { useContext } from "react";
import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { AuthContext } from "../components/AuthProvider";
import TopBar from "../components/TopBar";
import SideBar from "../components/SideBar";
import FileViewer from "../components/FileViewer";
import QuestionEditor from "../components/QuestionEditor";

const backendHost = import.meta.env.VITE_BACKEND_HOST;

export default function QuizMakerSkeleton() {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [selectedFileId, setSelectedFileId] = useState(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [quizMetadata, setQuizMetadata] = useState(null);
  const { authFetch } = useContext(AuthContext);
  const queryClient = useQueryClient();

  //handle uploaded file
  const handleFileUpload = async (file) => {
    setIsUploading(true);

    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/pdf", // .docx
    ];
    const MAX_FILE_SIZE_BYTES = 1 * 1024 * 1024;

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
        await queryClient.invalidateQueries({ queryKey: ["docFetch"] });
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

  const fetchQuestions = async (quizId) => {
    const response = await authFetch(
      `${backendHost}/api/quizzes/questions?quizId=${quizId}`,
      {
        credentials: "include",
      },
    );
    if (!response || !response.ok) {
      throw new Error("Failed to fetch questions");
    }
    const result = await response.json();
    if (!result.success) {
      throw new Error(
        `Failed to fetch questions: ${result.message || result.error}`,
      );
    }

    return result;
  };

  const { data: queryQuestionsData, isFetching } = useQuery({
    queryKey: ["quizQuestions", quizMetadata?.id],
    queryFn: () => fetchQuestions(quizMetadata?.id),
    enabled: !!quizMetadata?.id,
    staleTime: 1000 * 60 * 5,
  });

  //determine which file is selected
  const selectedFile =
    uploadedFiles?.find((f) => f.id === selectedFileId) || null;

  const selectedQuestion =
    queryQuestionsData?.questionList?.find(
      (q) => q.id === selectedQuestionId,
    ) ?? null;

  // -------------------------------------------------------------------------------
  //  ERROR BOUNDARY
  // -------------------------------------------------------------------------------
  if (!backendHost) {
    return <Navigate to="/error" replace />;
  }

  // -------------------------------------------------------------------------------
  // MAIN COMPONENT
  // -------------------------------------------------------------------------------
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
        setQuizMetadata={setQuizMetadata}
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
          questions={queryQuestionsData?.questionList}
          currentQuiz={quizMetadata}
          setCurrentQuiz={setQuizMetadata}
          isFetching={isFetching}
        />

        {/* Middle: Source File Viewer */}
        <FileViewer selectedFile={selectedFile} />

        {/* Right: Question Editor */}
        <QuestionEditor
          selectedQuestion={selectedQuestion}
          setSelectedQuestionId={setSelectedQuestionId}
          quizMetadata={quizMetadata}
        />
      </div>
    </div>
  );
}
