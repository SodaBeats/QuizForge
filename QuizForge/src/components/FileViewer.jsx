import { useQuery } from "@tanstack/react-query";
import { AuthContext } from "./AuthProvider";
import { useContext } from "react";
import LoadingScreen from "./LoadingScreen";

const backendHost = import.meta.env.VITE_BACKEND_HOST;

const scrollStyles = `
  .file-viewer-scroll::-webkit-scrollbar {
    width: 8px;
  }
  .file-viewer-scroll::-webkit-scrollbar-track {
    background: #26211c;
  }
  .file-viewer-scroll::-webkit-scrollbar-thumb {
    background: #4a3f34;
    border-radius: 6px;
  }
  .file-viewer-scroll::-webkit-scrollbar-thumb:hover {
    background: #5c4f42;
  }
  .file-viewer-scroll {
    scrollbar-width: thin;
    scrollbar-color: #4a3f34 #26211c;
    -webkit-overflow-scrolling: touch;
  }
`;

// EMPTY STATE ICON -------------------------------------------------------------
function NoFileIcon() {
  return (
    <div className="w-16 h-20 mx-auto mb-3 rounded-2xl bg-white shadow-[inset_3px_3px_6px_rgba(0,0,0,0.1),inset_-3px_-3px_6px_rgba(255,255,255,0.6),6px_6px_14px_rgba(0,0,0,0.35)] relative">
      <span className="absolute left-4 top-5 w-8 h-1 rounded bg-[#26211c]/25" />
      <span className="absolute left-4 top-8 w-6 h-1 rounded bg-[#26211c]/25" />
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

  const { data, isFetching } = useQuery({
    queryKey: ["fileContent", selectedFile?.id],
    queryFn: () => fetchFileContent(selectedFile?.id),
    enabled: !!selectedFile?.id,
    staleTime: 1000 * 60 * 30,
    refetchOnMount: false,
  });

  if (isFetching) {
    return (
      <div className="w-full lg:w-1/2 flex flex-col min-h-0 bg-[#26211c] font-body p-3">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=Inter:wght@400;500;600&display=swap');
          .font-display { font-family: 'Baloo 2', sans-serif; }
          .font-body { font-family: 'Inter', sans-serif; }
          ${scrollStyles}
        `}</style>
        <div className="flex-1 flex flex-col min-h-0 rounded-2xl bg-[#322b23] overflow-hidden shadow-[6px_6px_14px_rgba(0,0,0,0.4),-4px_-4px_10px_rgba(255,255,255,0.03)]">
          <div className="p-3.5 bg-[#3a3128]">
            <h2 className="text-sm font-display font-semibold text-[#e8ddce]">
              {selectedFile ? selectedFile.name : "File viewer"}
            </h2>
            <p className="text-xs text-[#766a59] mt-0.5">PDF or text viewer</p>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto p-4 file-viewer-scroll">
            <LoadingScreen />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full lg:w-1/2 flex flex-col min-h-0 bg-[#26211c] font-body p-3">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=Inter:wght@400;500;600&display=swap');
        .font-display { font-family: 'Baloo 2', sans-serif; }
        .font-body { font-family: 'Inter', sans-serif; }
        ${scrollStyles}
      `}</style>
      <div className="flex-1 flex flex-col min-h-0 rounded-2xl bg-[#322b23] overflow-hidden shadow-[6px_6px_14px_rgba(0,0,0,0.4),-4px_-4px_10px_rgba(255,255,255,0.03)]">
        <div className="p-3.5 bg-[#3a3128]">
          <h2 className="text-sm font-display font-semibold text-[#e8ddce]">
            {selectedFile ? selectedFile.name : "File viewer"}
          </h2>
          <p className="text-xs text-[#766a59] mt-0.5">PDF or text viewer</p>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto p-4 file-viewer-scroll">
          {data?.content ? (
            <div className="font-body text-white text-sm sm:text-[15px] whitespace-pre-wrap leading-[1.8] break-words">
              {data.content}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <NoFileIcon />
                <p className="text-[#6b5f52] text-sm font-mono">
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
