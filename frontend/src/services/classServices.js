const backendHost = import.meta.env.VITE_BACKEND_HOST;

export const classServices = {
  async fetchClasses(authFetch) {
    const response = await authFetch(`${backendHost}/api/classes`, {
      method: "GET",
      credentials: "include",
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData?.errors?.map((e) => e.msg).join(", ") ||
          errorData?.message ||
          "Failed to fetch class",
      );
    }
    const result = await response.json();
    return result.classArray;
  },
};
