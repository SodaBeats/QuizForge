// src/features/quizzes/components/FileModal.jsx
import { useDocuments } from "../../documents/api/queries.js";
import { Modal } from "../../../components/ui/Modal";

// ------------------------------------------------------------------------------------
// SUB COMPONENT: File picker/upload modal
// -------------------------------------------------------------------------------------
export function FileModal({
  closeFileModal,
  handleSelectDocument,
  fetchMoreDocuments,
  fetchPreviousDocuments,
  isUploading,
  selectedFileId,
  page,
}) {
  const { data, isFetching, error } = useDocuments(page);

  const totalDocuments = data?.totalDocuments || data?.total || 0;

  if (isFetching) {
    return (
      <Modal
        onClose={closeFileModal}
        panelClassName="modal-panel border-2 border-muted w-96 max-h-[80vh] overflow-y-auto p-6"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-display font-semibold text-inkondark">
            My Documents
          </h2>
          <button
            onClick={closeFileModal}
            className="text-red-500 hover:text-red-700 text-2xl leading-none"
          >
            ×
          </button>
        </div>
        <div className="space-y-2 mb-6">
          <p className="text-muted text-center py-4">Fetching...</p>
        </div>
      </Modal>
    );
  }

  if (error) {
    return (
      <Modal
        onClose={closeFileModal}
        panelClassName="modal-panel border-2 border-muted w-96 max-h-[80vh] overflow-y-auto p-6"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-display font-semibold text-inkondark">
            My Documents
          </h2>
          <button
            onClick={closeFileModal}
            className="text-red-500 hover:text-red-700 text-2xl leading-none"
          >
            ×
          </button>
        </div>
        <div className="space-y-2 mb-6">
          <p className="text-red-400 text-center py-4">
            Something went wrong while fetching documents
          </p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      onClose={closeFileModal}
      panelClassName="modal-panel border-2 border-muted w-96 max-h-[80vh] overflow-y-auto p-6"
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-display font-semibold text-inkondark">
          My Documents
        </h2>
        <button
          onClick={closeFileModal}
          className="text-red-500 hover:text-red-700 text-2xl leading-none"
        >
          ×
        </button>
      </div>

      <div className="space-y-2 mb-6">
        {data.documents.length > 0 ? (
          data.documents.map((doc) => (
            <div
              key={doc.id}
              onClick={() => handleSelectDocument(doc)}
              className={`p-3 rounded-md cursor-pointer transition-all truncate ${
                selectedFileId === doc.id
                  ? "bg-accent text-inkondark font-semibold "
                  : "hover:bg-muted/20 text-inkondark border border-muted/20"
              }`}
            >
              <span className="truncate">
                {doc.title || `Document ${doc.id}` || "Untitled"}
              </span>
            </div>
          ))
        ) : (
          <p className="text-muted text-center py-4">No documents found</p>
        )}
      </div>

      {/* Pagination Controls */}
      {totalDocuments > 5 && (
        <div className="flex items-center justify-center gap-4 mb-4 pt-4">
          <button
            onClick={fetchPreviousDocuments}
            disabled={page === 0}
            className="btn-secondary py-2"
            title="Previous page"
          >
            ← Prev
          </button>
          <span className="text-muted text-sm">Page {page + 1}</span>
          <button
            onClick={fetchMoreDocuments}
            disabled={
              page * 5 + (data?.documents?.length || 0) >= totalDocuments
            }
            className="btn-secondary py-2"
            title="Next page"
          >
            Next →
          </button>
        </div>
      )}

      <div className="pt-4">
        <button
          onClick={() => document.getElementById("file-upload").click()}
          disabled={isUploading}
          className="w-full btn-primary py-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0.5"
        >
          {isUploading ? "Uploading..." : "Upload new document"}
        </button>
      </div>
    </Modal>
  );
}
