/* Document reads (Phase 2.3). */

import { useQuery } from "@tanstack/react-query";
import { docKeys } from "../../../lib/queryKeys.js";
import { documentsApi } from "./documents.api.js";

export function useDocuments(page = 0) {
  return useQuery({
    queryKey: docKeys.list(page),
    queryFn: () => documentsApi.list(page),
  });
}

export function useAllDocuments({ enabled = true } = {}) {
  return useQuery({
    queryKey: docKeys.allList,
    queryFn: documentsApi.listAll,
    enabled,
  });
}

export function useDocumentContent(id, { enabled = true } = {}) {
  return useQuery({
    queryKey: docKeys.content(id),
    queryFn: () => documentsApi.content(id),
    enabled: Boolean(id) && enabled,
  });
}
