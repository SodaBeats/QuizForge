/* Document writes (Phase 2.3–2.4). */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { docKeys } from "../../../lib/queryKeys.js";
import { documentsApi } from "./documents.api.js";

export function useUploadDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file) => documentsApi.upload(file),
    onSuccess: () => {
      // Both the paginated picker and the all-documents sources list.
      queryClient.invalidateQueries({ queryKey: docKeys.all });
    },
  });
}
