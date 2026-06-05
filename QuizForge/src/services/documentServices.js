const backendHost = import.meta.env.VITE_BACKEND_HOST;

export const documentServices = {
  async fetchDocs(authFetch, page = 0) {
    const offset = page * 5;
    const limit = 5;
    const response = await authFetch(
      `${backendHost}/api/documents?limit=${limit}&offset=${offset}`,
      { credentials: "include" },
    );
    if (!response || !response.ok) {
      const result = await response.json();
      throw new Error(
        result.errors?.map((e) => e.msg).join(", ") ||
          result?.message ||
          "failed to fetch docs",
      );
    }
    return await response.json();
  },
};
