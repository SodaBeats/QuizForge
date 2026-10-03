import { useQuery } from "@tanstack/react-query";
import { AuthContext } from "../AuthProvider";
import { useContext } from "react";
import LoadingScreen from "../LoadingScreen";

const backendHost = import.meta.env.VITE_BACKEND_HOST;

const scrollStyles = `
  .file-viewer-scroll::-webkit-scrollbar {
    width: 8px;
  }
  .file-viewer-scroll::-webkit-scrollbar-track {
    background: var(--surface);
  }
  .file-viewer-scroll::-webkit-scrollbar-thumb {
    background: var(--surface);
    border-radius: 6px;
  }
  .file-viewer-scroll::-webkit-scrollbar-thumb:hover {
    background: var(--surface);
  }
  .file-viewer-scroll {
    scrollbar-width: thin;
    scrollbar-color: var(--surface) var(--surface);
    -webkit-overflow-scrolling: touch;
  }
`;

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
  const { authFetch } = useContext(AuthContext);

  // FUNCTION -------------------------------------------------------------------
  const fetchFileContent = async (id) => {
    const resp = await authFetch(`${backendHost}/api/documents/${id}`, {
      credentials: "include",
    });
    if (!resp) {
      throw new Error("Authentication failed or no response received");
    }
    if (!resp.ok) {
      throw new Error(`HTTP error! status: ${resp.status}`);
    }
    return await resp.json();
  };

  const { data, isFetching, error } = useQuery({
    queryKey: ["fileContent", selectedFile?.id],
    queryFn: () => fetchFileContent(selectedFile?.id),
    enabled: !!selectedFile?.id,
    staleTime: 1000 * 60 * 30,
    refetchOnMount: false,
  });

  if (isFetching) {
    return (
      <div className="w-full lg:w-1/2 flex flex-col min-h-0 bg-deepbluegray font-body p-3">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=Inter:wght@400;500;600&display=swap');
          .font-display { font-family: 'Baloo 2', sans-serif; }
          .font-body { font-family: 'Inter', sans-serif; }
          ${scrollStyles}
        `}</style>
        <div className="flex-1 flex flex-col min-h-0 rounded-lg bg-tealgray overflow-hidden border border-accent">
          <div className="p-3.5 bg-blackblue border-b border-muted/20">
            <h2 className="text-sm font-display font-semibold text-inkondark">
              {selectedFile ? selectedFile.name : "File viewer"}
            </h2>
            <p className="text-xs text-muted mt-0.5">PDF or text viewer</p>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto p-4 file-viewer-scroll">
            <LoadingScreen />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full lg:w-1/2 flex flex-col min-h-0 bg-deepbluegray font-body p-3">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=Inter:wght@400;500;600&display=swap');
        .font-display { font-family: 'Baloo 2', sans-serif; }
        .font-body { font-family: 'Inter', sans-serif; }
        ${scrollStyles}
      `}</style>
      <div className="flex-1 flex flex-col min-h-0 rounded-lg bg-tealgray overflow-hidden border border-accent">
        <div className="p-3.5 bg-blackblue border-b border-muted/20">
          <h2 className="text-sm font-display font-semibold text-inkondark">
            {selectedFile ? selectedFile.name : "File viewer"}
          </h2>
          <p className="text-xs text-muted mt-0.5">PDF or text viewer</p>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto p-4 file-viewer-scroll">
          {error ? (
            <div className="h-full flex items-center justify-center">
              <div className="rounded-md bg-blackblue border border-red-400/50 px-5 py-4">
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
    </div>
  );
}
