import { useState } from "react";
import toast from "react-hot-toast";
import { AppShell } from "../../../components/layout/AppShell";
import { SidebarNav } from "../../../components/layout/SidebarNav";
import { TEACHER_NAV_ITEMS } from "../../../components/layout/teacherNavItems";
import { WorkstationPanel } from "../components/WorkstationPanel";
import { FileViewer } from "../components/FileViewer";
import { QuestionEditor } from "../components/QuestionEditor";
import { ForgeQuizAction } from "../components/ForgeQuizAction";
import { useUploadDocument } from "../../documents/api/mutations.js";
import { useQuizQuestions } from "../api/queries.js";

// AppShell page (aligned with ClassesPage/QuizzesPage): topbar spans the
// full width, the collapsed section nav sits desktop-only at the left, and
// the workstation panel / viewer / editor are panels below it. The old frame
// (nested topbar, SideBar as a root sibling, order-2 tricks) is gone; the
// logo lives back in the topbar, so WorkstationPanel no longer carries it.
// Root keeps `alt-display-root font-displayAlt` — the F12 Space Grotesk
// scoping (see index.css).
const ROOT_CLASS =
  "h-dvh min-h-0 flex flex-col bg-canvas text-inkondark alt-display-root font-displayAlt";
const CONTAINER_CLASS =
  "flex-1 min-h-0 min-w-0 flex flex-col overflow-hidden lg:flex-row";
const PANEL_CLASS = "flex flex-1 min-h-0";

export function QuizMakerPage() {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [selectedFileId, setSelectedFileId] = useState(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [quizMetadata, setQuizMetadata] = useState(null);
  const [mobileTab, setMobileTab] = useState("sidebar"); // mobile-only panel switcher — purely UI state, no data logic
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
    <AppShell
      topbarProps={{
        actions: (
          <ForgeQuizAction
            selectedFile={selectedFile}
            setQuizMetadata={setQuizMetadata}
          />
        ),
      }}
      nav={<SidebarNav items={TEACHER_NAV_ITEMS} collapsed />}
      tabs={[
        { key: "sidebar", label: "Files" },
        { key: "viewer", label: "Viewer" },
        { key: "editor", label: "Editor" },
      ]}
      activeTab={mobileTab}
      onChange={setMobileTab}
      rootClassName={ROOT_CLASS}
      containerClassName={CONTAINER_CLASS}
      panels={[
        {
          key: "sidebar",
          activeClass: PANEL_CLASS,
          children: (
            <WorkstationPanel
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
          ),
        },
        {
          key: "viewer",
          activeClass: PANEL_CLASS,
          children: <FileViewer selectedFile={selectedFile} />,
        },
        {
          key: "editor",
          activeClass: PANEL_CLASS,
          children: (
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
          ),
        },
      ]}
    />
  );
}
