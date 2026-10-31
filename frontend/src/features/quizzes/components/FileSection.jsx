import { useState } from "react";
import { FileModal } from "./FileModal";

export function FileSection({
  uploadedFiles,
  setUploadedFiles,
  selectedFileId,
  setSelectedFileId,
  handleFileUpload,
  isUploading,
}) {
  const [showFileModal, setShowFileModal] = useState(false);
  const [filePage, setFilePage] = useState(0);

  const openFileModal = async () => {
    setShowFileModal(true);
  };

  const closeFileModal = () => {
    setShowFileModal(false);
    setFilePage(0);
  };

  const fetchMoreDocuments = () => {
    setFilePage(filePage + 1);
  };

  const fetchPreviousDocuments = () => {
    if (filePage > 0) {
      setFilePage(filePage - 1);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      handleFileUpload(file);
      setShowFileModal(false);
    }
  };

  const handleSelectDocument = async (doc) => {
    setShowFileModal(false);
    setSelectedFileId(doc.id);
    setUploadedFiles((prev) =>
      prev.some((file) => file.id === doc.id)
        ? prev
        : [
            ...prev,
            {
              id: doc.id,
              name: doc.title || String(doc.id),
              nickname: doc.title || String(doc.id),
              content: null,
            },
          ],
    );
  };

  const handleFileDelete = async (fileId) => {
    setUploadedFiles((prev) => prev.filter((file) => file.id !== fileId));
    if (selectedFileId === fileId) {
      setSelectedFileId(null);
    }
  };

  return (
    <>
      <div className="h-[30%] rounded-lg p-2 overflow-y-auto border border-muted/20">
        <div className="flex flex-row items-center justify-between mb-3 pb-2 border-b border-muted/20">
          <div className="text-xs font-semibold text-inkondark uppercase tracking-wide">
            Files
          </div>
          <button
            onClick={openFileModal}
            title="Add file"
            className="w-6 h-6 flex items-center justify-center rounded-lg text-inkondark bg-accent font-bold leading-none transition-all hover:-translate-y-0.5 active:translate-y-0.5"
          >
            +
          </button>
        </div>
        {isUploading && (
          <div
            role="status"
            aria-live="polite"
            className="mb-2 flex items-center gap-2 rounded-md border border-accept/50 bg-darkslate px-2 py-1.5 text-xs text-inkondark"
          >
            <span
              aria-hidden="true"
              className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-accept border-t-transparent motion-reduce:animate-none"
            />
            Uploading document...
          </div>
        )}
        <div className="space-y-0.5">
          {uploadedFiles.length > 0 ? (
            uploadedFiles.map((file) => (
              <div
                key={file.id}
                className={`py-0.5 px-2 rounded-md text-xs flex items-center justify-between group transition-all ${
                  selectedFileId === file.id
                    ? "bg-accent text-inkondark font-medium"
                    : "hover:bg-muted/20 text-inkondark border border-muted/20"
                }`}
              >
                <div
                  className="cursor-pointer truncate flex-1"
                  onClick={() => setSelectedFileId(file.id)}
                >
                  {file.name}
                </div>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    handleFileDelete(file.id);
                  }}
                  className={`ml-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ${
                    selectedFileId === file.id
                      ? "text-inkondark hover:text-red-500"
                      : "text-red-400 hover:text-red-500"
                  }`}
                >
                  ✕
                </button>
              </div>
            ))
          ) : (
            <div className="text-muted text-sm">No file uploaded</div>
          )}
        </div>
      </div>
      <input
        type="file"
        id="file-upload"
        className="hidden"
        accept=".pdf,.docx"
        onChange={handleFileChange}
      />
      {showFileModal && (
        <FileModal
          closeFileModal={closeFileModal}
          handleSelectDocument={handleSelectDocument}
          fetchMoreDocuments={fetchMoreDocuments}
          fetchPreviousDocuments={fetchPreviousDocuments}
          isUploading={isUploading}
          selectedFileId={selectedFileId}
          page={filePage}
        />
      )}
    </>
  );
}
