import { useState } from "react";
import toast from "react-hot-toast";
import { TeacherTopbar } from "../../../components/layout/TeacherTopbar";
import { SideBar } from "../components/SideBar";
import { FileViewer } from "../components/FileViewer";
import { QuestionEditor } from "../components/QuestionEditor";
import { ForgeQuizAction } from "../components/ForgeQuizAction";
import { useUploadDocument } from "../../documents/api/mutations.js";
import { useQuizQuestions } from "../api/queries.js";

export function QuizMakerPage() {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [selectedFileId, setSelectedFileId] = useState(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [quizMetadata, setQuizMetadata] = useState(null);
  const [mobileTab, setMobileTab] = useState("sidebar");
  const uploadDocument = useUploadDocument();
  const [generationStatus, setGenerationStatus] = useState({
    isGenerating: false,
    failed: false,
    amount: 5,
  });

  const handleFileUpload = async (file) => {
    setIsUploading(true);

    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/pdf",
    ];
    const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload a DOCX or PDF file");
      setIsUploading(false);
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error(`File is too large. Maximum size is 2MB.`);
      setIsUploading(false);
      return;
    }

    try {
      const result = await uploadDocument.mutateAsync(file);

      const newFile = {
        id: result.fileId,
        name: result.fileName,
        nickname: result.fileName,
        type: file.type,
        content: result.content,
      };
      setUploadedFiles([...uploadedFiles, newFile]);
      setSelectedFileId(result.fileId);
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const {
    data: queryQuestionsData,
    isFetching,
    error: questionsError,
  } = useQuizQuestions(quizMetadata?.id, {
    enabled: !!quizMetadata?.id && quizMetadata.questionCount > 0,
  });

  const selectedFile =
    uploadedFiles?.find((f) => f.id === selectedFileId) || null;

  const selectedQuestion =
    queryQuestionsData?.questionList?.find(
      (q) => q.id === selectedQuestionId,
    ) ?? null;


  return (
    <div className="h-dvh flex flex-col lg:flex-row bg-canvas text-inkondark alt-display-root font-displayAlt">

      {/* Left: Sidebar — upload lives here. On mobile it's a tab panel ordered
          below the topbar; at lg+ it cuts into the topbar's row, spanning the
          full height while the topbar starts to its right. */}
      <div
        className={`order-2 ${
          mobileTab === "sidebar" ? "flex flex-1 min-h-0" : "hidden"
        } lg:order-none lg:flex lg:flex-none lg:w-52 lg:min-h-0`}
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
          questionsError={questionsError}
          currentQuiz={quizMetadata}
          setCurrentQuiz={setQuizMetadata}
          isFetching={isFetching}
          handleFileUpload={handleFileUpload}
          isUploading={isUploading}
          isGenerating={generationStatus.isGenerating}
          generationFailed={generationStatus.failed}
          generationAmount={generationStatus.amount}
        />
      </div>

      {/* Right column: top bar + (mobile) tab switcher + viewer/editor panels.
          flex-none while the sidebar panel owns the mobile screen so the
          sidebar keeps the remaining height below the topbar. */}
      <div
        className={`${
          mobileTab === "sidebar" ? "flex-none" : "flex-1"
        } lg:flex-1 flex flex-col min-h-0 min-w-0`}
      >
        {/* Top Bar — needs selectedFile (for pre-filling quiz title) and
            setQuizMetadata. The logo lives in the sidebar at lg+, so the
            topbar only shows it below lg. */}
        <TeacherTopbar
          logoClass="lg:hidden"
          actions={
            <ForgeQuizAction
              selectedFile={selectedFile}
              setQuizMetadata={setQuizMetadata}
            />
          }
        />

        {/* Mobile/tablet panel switcher */}
        <div className="flex lg:hidden border-b border-muted/20 bg-canvas font-body">
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
                  ? "text-accent"
                  : "text-muted hover:text-inkondark"
              }`}
            >
              {tab.label}
              {mobileTab === tab.key && (
                <span className="absolute left-0 bottom-0 w-full h-[2px] bg-accent" />
              )}
            </button>
          ))}
        </div>

        {/* Panels: source file viewer + question editor */}
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
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
              onGenerationStart={(amount) =>
                setGenerationStatus({
                  isGenerating: true,
                  failed: false,
                  amount,
                })
              }
              onGenerationComplete={(failed) =>
                setGenerationStatus((status) => ({
                  ...status,
                  isGenerating: false,
                  failed,
                }))
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
