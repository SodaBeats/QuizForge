import { useQuery } from "@tanstack/react-query";
import { AuthContext } from "./AuthProvider";
import { useContext } from "react";
import LoadingScreen from "./LoadingScreen";

const backendHost = import.meta.env.VITE_BACKEND_HOST;

// MAIN COMPONENT -------------------------------------------------------------
export default function FileViewer({ selectedFile }) {
  const { authFetch } = useContext(AuthContext);

  // FUNCTION -------------------------------------------------------------------
  const fetchFileContent = async (id) => {
    const resp = await authFetch(`${backendHost}/api/documents/${id}`, {
      credentials: "include",
    });
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
      <div className="w-1/2 flex flex-col border-r border-gray-700">
        <div className="border-b border-gray-700 p-3 bg-gray-800">
          <h2 className="text-sm font-semibold">
            {selectedFile ? selectedFile.name : "File Viewer"}
          </h2>
          <p className="text-xs text-gray-400">PDF/text viewer</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 bg-gray-900">
          <LoadingScreen />
        </div>
      </div>
    );
  }

  return (
    <div className="w-1/2 flex flex-col border-r border-gray-700">
      <div className="border-b border-gray-700 p-3 bg-gray-800">
        <h2 className="text-sm font-semibold">
          {selectedFile ? selectedFile.name : "File Viewer"}
        </h2>
        <p className="text-xs text-gray-400">PDF/text viewer</p>
      </div>
      <div className="flex-1 overflow-y-auto p-4 bg-gray-900">
        <div className="font-mono text-gray-100 text-sm whitespace-pre-wrap">
          {data?.content || "No file selected"}
        </div>
      </div>
    </div>
  );
}
