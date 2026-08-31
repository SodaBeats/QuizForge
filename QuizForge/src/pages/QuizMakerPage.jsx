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
  const [mobileTab, setMobileTab] = useState("sidebar"); // mobile-only panel switcher — purely UI state, no data logic
  const { authFetch } = useContext(AuthContext);
  const queryClient = useQueryClient();

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
        await queryClient.invalidateQueries({ queryKey: ["docFetch"] });
      } else {
        alert("Error: " + result.error);
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert(error.message || "Failed to upload file. Please try again.");
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
      const result = await response.json();
      throw new Error(
        result.errors?.map((e) => e.msg).join(", ") ||
          result?.message ||
          "failed to fetch questions",
      );
    }
    const result = await response.json();

    return result;
  };

  const { data: queryQuestionsData, isFetching } = useQuery({
    queryKey: ["quizQuestions", quizMetadata?.id],
    queryFn: () => fetchQuestions(quizMetadata?.id),
    staleTime: 1000 * 60 * 5,
    enabled: !!quizMetadata?.id && quizMetadata.questionCount > 0,
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
    <div className="h-dvh flex flex-col bg-[#0D0906] text-[#F5F2EC]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
        .font-display { font-family: 'Space Grotesk', sans-serif; }
        .font-body { font-family: 'Inter', sans-serif; }
      `}</style>

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

      {/* Mobile/tablet panel switcher — hidden on desktop, where all 3 panels show at once */}
      <div className="flex lg:hidden border-b border-[#2A241C] bg-[#12100D] font-body">
        {[
          { key: "sidebar", label: "Files" },
          { key: "viewer", label: "Viewer" },
          { key: "editor", label: "Editor" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setMobileTab(tab.key)}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors relative ${
              mobileTab === tab.key
                ? "text-[#FF7A1A]"
                : "text-[#7A756A] hover:text-[#C9C4B3]"
            }`}
          >
            {tab.label}
            {mobileTab === tab.key && (
              <span className="absolute left-0 bottom-0 w-full h-[2px] bg-[#FF7A1A]" />
            )}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
        {/* Left: Sidebar */}
        <div
          className={`${
            mobileTab === "sidebar" ? "flex flex-1 min-h-0" : "hidden"
          } lg:contents`}
        >
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
        </div>

        {/* Middle: Source File Viewer */}
        <div
          className={`${
            mobileTab === "viewer" ? "flex flex-1 min-h-0" : "hidden"
          } lg:contents`}
        >
          <FileViewer selectedFile={selectedFile} />
        </div>

        {/* Right: Question Editor */}
        <div
          className={`${
            mobileTab === "editor" ? "flex flex-1 min-h-0" : "hidden"
          } lg:contents`}
        >
          <QuestionEditor
            selectedQuestion={selectedQuestion}
            setSelectedQuestionId={setSelectedQuestionId}
            quizMetadata={quizMetadata}
          />
        </div>
      </div>
    </div>
  );
}
