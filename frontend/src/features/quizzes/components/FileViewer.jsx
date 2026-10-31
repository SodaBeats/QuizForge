import LoadingScreen from "../../../components/layout/LoadingScreen";
import { useDocumentContent } from "../../documents/api/queries.js";

// EMPTY STATE ICON -------------------------------------------------------------
function NoFileIcon() {
  return (
    <div className="w-16 h-20 mx-auto mb-3 rounded-lg bg-inkondark border border-muted/30 relative">
      <span className="absolute left-4 top-5 w-8 h-1 rounded bg-accent/25" />
      <span className="absolute left-4 top-8 w-6 h-1 rounded bg-accent/25" />
    </div>
  );
}

// MAIN COMPONENT -------------------------------------------------------------
export default function FileViewer({ selectedFile }) {
  const { data, isFetching, error } = useDocumentContent(selectedFile?.id);

  if (isFetching) {
    return (
      <div className="flex-1 min-h-0 m-3 flex flex-col font-body rounded-lg bg-surface overflow-hidden border border-accent">
        <div className="p-3.5 bg-ink border-b border-muted/20">
          <h2 className="text-sm font-display font-semibold text-inkondark">
            {selectedFile ? selectedFile.name : "File viewer"}
          </h2>
          <p className="text-xs text-muted mt-0.5">PDF or text viewer</p>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto p-4 file-viewer-scroll">
          <LoadingScreen />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 m-3 flex flex-col font-body rounded-lg bg-surface overflow-hidden border border-accent">
      <div className="p-3.5 bg-specialsurface border-b border-muted/20">
        <h2 className="text-sm font-display font-semibold text-inkondark">
          {selectedFile ? selectedFile.name : "File viewer"}
        </h2>
        <p className="text-xs text-muted mt-0.5">PDF or text viewer</p>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto p-4 file-viewer-scroll">
        {error ? (
          <div className="h-full flex items-center justify-center">
            <div className="rounded-md bg-ink border border-red-400/50 px-5 py-4">
              <p className="text-red-400 text-sm font-mono text-center">
                Failed to load this file
              </p>
            </div>
          </div>
        ) : data?.content ? (
          <div className="font-body text-inkondark text-sm sm:text-[15px] whitespace-pre-wrap leading-[1.8] break-words">
            {data.content}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <NoFileIcon />
              <p className="text-inkondark text-sm font-mono">
                No file selected
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
